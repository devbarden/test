import { EventSourceParserStream } from 'eventsource-parser/stream'
import { z } from 'zod'
import { UpstreamError } from '../../errors/app-error.server'
import type { StreamWatchdog } from './stream-watchdog.server'

const deltaSchema = z.object({ text: z.string() })

const MAX_EVENT_BYTES = 64 * 1024

// ═══════════════════════════════════════════════════════════════════════════
//   Past the first byte every failure — a parse error, an event over the
//   size bound, a timeout, the provider's own `error` event — is one thing
//   to the user: the letter broke off.
// ═══════════════════════════════════════════════════════════════════════════
export async function* readDeltas(
	body: ReadableStream<Uint8Array<ArrayBuffer>>,
	watchdog: StreamWatchdog,
): AsyncGenerator<string> {
	const events = body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(new EventSourceParserStream({ maxBufferSize: MAX_EVENT_BYTES }))

	try {
		for await (const { data, event } of events) {
			watchdog.feed()

			if (data === '[DONE]') return
			if (event === 'error') throw new Error(data)
			if (event === 'delta') yield deltaSchema.parse(JSON.parse(data)).text
		}
	} catch (cause) {
		throw new UpstreamError('interrupted', 'Generation stream broke off', { cause })
	} finally {
		watchdog.stop()
	}
}
