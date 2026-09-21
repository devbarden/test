import { readableStreamFrom } from '@/lib/readable-stream-from'

// ═══════════════════════════════════════════════════════════════════════════
//   A newline-delimited JSON stream. `no-transform` and X-Accel-Buffering
//   ask every proxy on the way (Railway's edge included) not to compress or
//   buffer the body — either would hold fragments back and turn a stream
//   into one late delivery. Cancelling the body (the browser went away)
//   returns the source iterator, which aborts the work behind it.
// ═══════════════════════════════════════════════════════════════════════════
export function ndjsonResponse<T>(events: AsyncIterable<T>): Response {
	const body = readableStreamFrom(events)
		.pipeThrough(
			new TransformStream<T, string>({
				transform(event, controller) {
					controller.enqueue(`${JSON.stringify(event)}\n`)
				},
			}),
		)
		.pipeThrough(new TextEncoderStream())

	return new Response(body, {
		headers: {
			'Cache-Control': 'no-store, no-transform',
			'Content-Type': 'application/x-ndjson; charset=utf-8',
			'X-Accel-Buffering': 'no',
		},
	})
}
