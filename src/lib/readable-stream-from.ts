// ═══════════════════════════════════════════════════════════════════════════
//   Cancelling the stream calls `return()` on the iterator, which runs the
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
