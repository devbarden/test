import { readableStreamFrom } from '@/lib/readable-stream-from'

// ═══════════════════════════════════════════════════════════════════════════
//   `no-transform` and X-Accel-Buffering keep proxies from buffering the
//   stream.
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
