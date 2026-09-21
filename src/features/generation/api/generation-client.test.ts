import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LetterGenerationFailure, requestLetter } from './generation-client'

const command = {
	input: {
		company: 'Apple',
		details: '',
		jobTitle: 'Product manager',
		skills: 'HTML',
		tone: 'professional' as const,
	},
}

const application = {
	createdAt: '2026-09-21T10:00:00.000Z',
	id: '0199b0b0-0000-7000-8000-000000000001',
	input: command.input,
	letter: 'Dear Apple',
	updatedAt: '2026-09-21T10:00:00.000Z',
}

function ndjson(lines: string[]): Response {
	return new Response(lines.join(''), {
		headers: { 'Content-Type': 'application/x-ndjson' },
	})
}

async function collect(): Promise<string> {
	let text = ''

	for await (const fragment of requestLetter(
		command,
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

	it('yields deltas and returns the saved application from done', async () => {
		fetchMock.mockResolvedValue(
			ndjson([
				'{"type":"delta","text":"Dear "}\n',
				'{"type":"delta","text":"Apple"}\n',
				`${JSON.stringify({ application, type: 'done' })}\n`,
			]),
		)

		const stream = requestLetter(command, new AbortController().signal)
		const fragments: string[] = []
		let result = await stream.next()

		while (!result.done) {
			if (result.value.type === 'delta') fragments.push(result.value.text)
			result = await stream.next()
		}

		expect(fragments.join('')).toBe('Dear Apple')
		expect(result.value).toEqual(application)
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

	it('gives up as interrupted when the server goes silent', async () => {
		vi.useFakeTimers()

		try {
			fetchMock.mockImplementation(
				async (_url, init) =>
					new Response(
						new ReadableStream({
							start(controller) {
								init?.signal?.addEventListener('abort', () =>
									controller.error(init.signal?.reason),
								)
							},
						}),
					),
			)

			const pending = failure()

			await vi.advanceTimersByTimeAsync(60_000)

			expect((await pending).error).toEqual({ code: 'interrupted' })
		} finally {
			vi.useRealTimers()
		}
	})

	it('rethrows a Stop as it is, not as a failure', async () => {
		const controller = new AbortController()

		fetchMock.mockImplementation(async () => {
			controller.abort()
			throw new DOMException('aborted', 'AbortError')
		})

		const error = await requestLetter(command, controller.signal)
			.next()
			.catch((cause: unknown) => cause)

		expect(error).not.toBeInstanceOf(LetterGenerationFailure)
	})

	it('reports a request that never reached the server as a network error', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

		expect((await failure()).error).toEqual({ code: 'network' })
	})
})
