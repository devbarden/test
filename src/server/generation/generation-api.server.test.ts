import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readableStreamFrom } from '@/lib/readable-stream-from'
import { openGenerationStream } from './generation-api.server'
import { GenerationFailure } from './generation-failure'

const request = {
	prompt: 'Write a letter',
	signal: new AbortController().signal,
	system: 'Be concise',
}

async function* toAsync<T>(items: T[]): AsyncGenerator<T> {
	yield* items
}

function sseResponse(chunks: string[]): Response {
	return new Response(
		readableStreamFrom(toAsync(chunks)).pipeThrough(new TextEncoderStream()),
		{ headers: { 'Content-Type': 'text/event-stream' } },
	)
}

async function collect(stream: AsyncIterable<string>): Promise<string> {
	let text = ''

	for await (const fragment of stream) text += fragment

	return text
}

async function failureOf(
	promise: Promise<unknown>,
): Promise<GenerationFailure> {
	const error = await promise.catch((cause: unknown) => cause)

	if (!(error instanceof GenerationFailure))
		throw new Error('Expected a GenerationFailure')

	return error
}

describe('openGenerationStream', () => {
	const fetchMock = vi.fn<typeof fetch>()

	beforeEach(() => {
		vi.stubEnv('GENERATION_API_TOKEN', 'tok_test')
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
		fetchMock.mockReset()
	})

	it('sends the token and the prompt, and joins delta fragments', async () => {
		fetchMock.mockResolvedValue(
			sseResponse([
				': keepalive\n\n',
				'event: delta\ndata: {"text":"Dear "}\n\n',
				'event: delta\ndata: {"text":"Apple"}\n\n',
				'data: [DONE]\n\n',
			]),
		)

		const text = await collect(await openGenerationStream(request))
		const [, init] = fetchMock.mock.calls[0] ?? []

		expect(text).toBe('Dear Apple')
		expect(new Headers(init?.headers).get('Authorization')).toBe(
			'Bearer tok_test',
		)
		expect(JSON.parse(String(init?.body))).toMatchObject({
			prompt: 'Write a letter',
			system: 'Be concise',
		})
	})

	it('treats a clean close without [DONE] as a finished letter, as documented', async () => {
		fetchMock.mockResolvedValue(
			sseResponse(['event: delta\ndata: {"text":"Hi"}\n\n']),
		)

		expect(await collect(await openGenerationStream(request))).toBe('Hi')
	})

	it('maps a 429 to rate_limited and keeps the Retry-After hint', async () => {
		fetchMock.mockResolvedValue(
			Response.json(
				{ error: { code: 'rate_limit_exceeded', message: 'Slow down' } },
				{ headers: { 'Retry-After': '14' }, status: 429 },
			),
		)

		const failure = await failureOf(openGenerationStream(request))

		expect(failure.error).toEqual({
			code: 'rate_limited',
			retryAfterSeconds: 14,
		})
	})

	it('reports a rejected token as unavailable, never as the user being unauthorized', async () => {
		fetchMock.mockResolvedValue(
			Response.json(
				{ error: { code: 'invalid_token', message: 'Missing token' } },
				{ status: 401 },
			),
		)

		const failure = await failureOf(openGenerationStream(request))

		expect(failure.error).toEqual({ code: 'unavailable' })
	})

	it('fails as interrupted when a delta arrives malformed mid-stream', async () => {
		fetchMock.mockResolvedValue(
			sseResponse([
				'event: delta\ndata: {"text":"Dear"}\n\n',
				'event: delta\ndata: not-json\n\n',
			]),
		)

		const stream = await openGenerationStream(request)
		const failure = await failureOf(collect(stream))

		expect(failure.error).toEqual({ code: 'interrupted' })
	})

	it('fails as unavailable when the network request itself fails', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'))

		const failure = await failureOf(openGenerationStream(request))

		expect(failure.error).toEqual({ code: 'unavailable' })
	})
})
