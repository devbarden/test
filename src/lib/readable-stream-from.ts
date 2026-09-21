// ═══════════════════════════════════════════════════════════════════════════
//   `ReadableStream.from` exists in Node but not in the DOM typings this
//   project compiles against. Written out, it also makes the one behaviour
//   the generation route depends on explicit: cancelling the stream (the
//   browser went away) calls `return()` on the iterator, which runs the
//   producer's `finally` and aborts the upstream request.
// ═══════════════════════════════════════════════════════════════════════════
export function readableStreamFrom<T>(
	iterable: AsyncIterable<T>,
): ReadableStream<T> {
	const iterator = iterable[Symbol.asyncIterator]()

	return new ReadableStream<T>({
		async cancel(reason) {
			await iterator.return?.(reason)
		},
		async pull(controller) {
			const { done, value } = await iterator.next()

			if (done) controller.close()
			else controller.enqueue(value)
		},
	})
}
