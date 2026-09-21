import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LetterGenerationFailure, requestLetter } from './generation-client'

const input = {
	company: 'Apple',
	details: '',
	jobTitle: 'Product manager',
	skills: 'HTML',
}

function ndjson(lines: string[]): Response {
	return new Response(lines.join(''), {
		headers: { 'Content-Type': 'application/x-ndjson' },
	})
}

async function collect(): Promise<string> {
	let text = ''

	for await (const fragment of requestLetter(
		input,
		new AbortController().signal,
	)) {
		text += fragment
	}

	return text
}

async function failure(): Promise<LetterGenerationFailure> {
	const error = await collect().catch((cause: unknown) => cause)

	if (!(error instanceof LetterGenerationFailure)) {
		throw new Error('Expected a LetterGenerationFailure')
	}

	return error
}

describe('requestLetter', () => {
	const fetchMock = vi.fn<typeof fetch>()

	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock)
	})
	afterEach(() => {
		vi.unstubAllGlobals()
		fetchMock.mockReset()
	})

	it('yields deltas until the done event', async () => {
		fetchMock.mockResolvedValue(
			ndjson([
				'{"type":"delta","text":"Dear "}\n',
				'{"type":"delta","text":"Apple"}\n',
				'{"type":"done"}\n',
			]),
		)

		expect(await collect()).toBe('Dear Apple')
	})

	it('treats a stream that ends without done as interrupted', async () => {
		fetchMock.mockResolvedValue(ndjson(['{"type":"delta","text":"Dear"}\n']))

		expect((await failure()).error).toEqual({ code: 'interrupted' })
	})

	it('surfaces an error event from the server', async () => {
		fetchMock.mockResolvedValue(
			ndjson([
				'{"type":"delta","text":"Dear"}\n',
				'{"type":"error","error":{"code":"unavailable"}}\n',
			]),
		)

		expect((await failure()).error).toEqual({ code: 'unavailable' })
	})

	it('reads the error body of a refused request', async () => {
		fetchMock.mockResolvedValue(
			Response.json(
				{ error: { code: 'rate_limited', retryAfterSeconds: 12 } },
				{ status: 429 },
			),
		)

		expect((await failure()).error).toEqual({
			code: 'rate_limited',
			retryAfterSeconds: 12,
		})
	})

	it('reports a request that never reached the server as a network error', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

		expect((await failure()).error).toEqual({ code: 'network' })
	})
})
