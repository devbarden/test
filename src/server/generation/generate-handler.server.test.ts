import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleGenerateRequest } from './generate-handler.server'
import { openGenerationStream } from './generation-api.server'
import { GenerationFailure } from './generation-failure'

vi.mock('./generation-api.server', () => ({ openGenerationStream: vi.fn() }))

const openStream = vi.mocked(openGenerationStream)

const validInput = {
	company: 'Apple',
	details: '',
	jobTitle: 'Product manager',
	skills: 'HTML',
}

let userCounter = 0

function post(body: unknown, headers: Record<string, string> = {}) {
	userCounter += 1

	return handleGenerateRequest(
		new Request('http://localhost/api/generate', {
			body: typeof body === 'string' ? body : JSON.stringify(body),
			headers: { 'Content-Type': 'application/json', ...headers },
			method: 'POST',
		}),
		`user-${userCounter}`,
	)
}

async function* fragments(...texts: string[]) {
	yield* texts
}

describe('handleGenerateRequest', () => {
	beforeEach(() => {
		openStream.mockReset()
	})

	it('streams NDJSON deltas followed by an explicit done', async () => {
		openStream.mockResolvedValue(fragments('Dear ', 'Apple'))

		const response = await post(validInput)
		const lines = (await response.text())
			.trim()
			.split('\n')
			.map((line) => JSON.parse(line))

		expect(response.headers.get('content-type')).toContain(
			'application/x-ndjson',
		)
		expect(lines).toEqual([
			{ text: 'Dear ', type: 'delta' },
			{ text: 'Apple', type: 'delta' },
			{ type: 'done' },
		])
	})

	it('ends the stream with an error event when the upstream breaks mid-letter', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})

		async function* broken() {
			yield 'Dear '
			throw new GenerationFailure({ code: 'interrupted' }, 'socket closed')
		}

		openStream.mockResolvedValue(broken())

		const lines = (await (await post(validInput)).text()).trim().split('\n')

		expect(JSON.parse(lines.at(-1) ?? '')).toEqual({
			error: { code: 'interrupted' },
			type: 'error',
		})
	})

	it('answers an upstream refusal with its status and retry hint', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.stubEnv('GENERATION_API_TOKEN', 'tok_test')
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				Response.json(
					{ error: { code: 'rate_limit_exceeded', message: 'Slow down' } },
					{ headers: { 'Retry-After': '9' }, status: 429 },
				),
			),
		)
		openStream.mockImplementation(async (request) => {
			const actual = await vi.importActual<
				typeof import('./generation-api.server')
			>('./generation-api.server')

			return actual.openGenerationStream(request)
		})

		const response = await post(validInput)

		expect(response.status).toBe(429)
		expect(response.headers.get('retry-after')).toBe('9')
		expect(await response.json()).toEqual({
			error: { code: 'rate_limited', retryAfterSeconds: 9 },
		})

		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it.each([
		['a missing field', { ...validInput, company: '  ' }, {}],
		[
			'details over the limit',
			{ ...validInput, details: 'a'.repeat(1201) },
			{},
		],
		['malformed JSON', '{oops', {}],
		['a non-JSON content type', validInput, { 'Content-Type': 'text/plain' }],
		['an oversized body', { ...validInput, details: 'a'.repeat(20_000) }, {}],
	])('refuses %s without calling the upstream', async (_, body, headers) => {
		const response = await post(body, headers)

		expect(response.status).toBe(400)
		expect(openStream).not.toHaveBeenCalled()
	})

	it('limits each user to four generations a minute', async () => {
		openStream.mockImplementation(async () => fragments('Hi'))

		const request = () =>
			handleGenerateRequest(
				new Request('http://localhost/api/generate', {
					body: JSON.stringify(validInput),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				}),
				'busy-user',
			)

		const statuses: number[] = []

		for (let attempt = 0; attempt < 5; attempt += 1) {
			statuses.push((await request()).status)
		}

		expect(statuses).toEqual([200, 200, 200, 200, 429])
	})
})
