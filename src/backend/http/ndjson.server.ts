const encoder = new TextEncoder()

// ═══════════════════════════════════════════════════════════════════════════
//   One JSON value per line, pulled from the iterator only as fast as the
//   client reads. Cancelling the response — the client went away — returns
//   the iterator, so the generator's own cleanup (aborting the upstream
//   request) runs.
// ═══════════════════════════════════════════════════════════════════════════
export function ndjsonResponse<T>(events: AsyncIterable<T>): Response {
	const iterator = events[Symbol.asyncIterator]()

	const body = new ReadableStream<Uint8Array>({
		async cancel() {
			await iterator.return?.()
		},
		async pull(controller) {
			const { done, value } = await iterator.next()

			if (done) controller.close()
			else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`))
		},
	})

	return new Response(body, {
		headers: {
			// ═════════════════════════════════════════════════════════════════
			//   `no-transform` and X-Accel-Buffering stop proxies buffering it.
			// ═════════════════════════════════════════════════════════════════
			'Cache-Control': 'no-store, no-transform',
			'Content-Type': 'application/x-ndjson; charset=utf-8',
			'X-Accel-Buffering': 'no',
		},
	})
}
