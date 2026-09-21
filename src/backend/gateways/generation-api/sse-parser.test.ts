import { describe, expect, it } from 'vitest'
import { readableStreamFrom } from '@/lib/readable-stream-from'
import { createSseParser, type SseEvent } from './sse-parser'

async function parse(chunks: string[]): Promise<SseEvent[]> {
	const events: SseEvent[] = []
	const stream = readableStreamFrom(toAsync(chunks)).pipeThrough(
		createSseParser(),
	)

	for await (const event of stream) events.push(event)

	return events
}

async function* toAsync<T>(items: T[]): AsyncGenerator<T> {
	yield* items
}

describe('createSseParser', () => {
	it('parses named events and skips comments', async () => {
		const events = await parse([
			': keepalive\n\n',
			'event: delta\ndata: {"text":"Hi"}\n\n',
			'data: [DONE]\n\n',
		])

		expect(events).toEqual([
			{ data: '{"text":"Hi"}', event: 'delta' },
			{ data: '[DONE]', event: 'message' },
		])
	})

	it('reassembles an event split at arbitrary chunk boundaries', async () => {
		const events = await parse([
			'ev',
			'ent: del',
			'ta\nda',
			'ta: {"text":',
			'"a"}\n',
			'\n',
		])

		expect(events).toEqual([{ data: '{"text":"a"}', event: 'delta' }])
	})

	it('accepts CRLF and CR line endings, including a CRLF split across chunks', async () => {
		const events = await parse([
			'event: delta\r',
			'\ndata: one\r\n\r\n',
			'data: two\r\r',
		])

		expect(events).toEqual([
			{ data: 'one', event: 'delta' },
			{ data: 'two', event: 'message' },
		])
	})

	it('joins multi-line data with a line feed', async () => {
		const events = await parse(['data: first\ndata: second\n\n'])

		expect(events).toEqual([{ data: 'first\nsecond', event: 'message' }])
	})

	it('strips exactly one leading space from a value', async () => {
		const events = await parse(['data:  padded\ndata:tight\n\n'])

		expect(events).toEqual([{ data: ' padded\ntight', event: 'message' }])
	})

	it('does not dispatch an event without data', async () => {
		const events = await parse(['event: delta\n\n', 'id: 1\n\n'])

		expect(events).toEqual([])
	})

	it('discards an event cut off by the end of the stream', async () => {
		const events = await parse(['data: whole\n\n', 'event: delta\ndata: {"te'])

		expect(events).toEqual([{ data: 'whole', event: 'message' }])
	})
})
