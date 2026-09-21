// ═══════════════════════════════════════════════════════════════════════════
//   Network chunks do not respect line boundaries: one chunk can end in the
//   middle of a JSON event, the next can carry three. This re-cuts the text
//   stream on "\n" and holds the unterminated tail back until it is whole.
// ═══════════════════════════════════════════════════════════════════════════
export function createLineSplitter(): TransformStream<string, string> {
	let buffer = ''

	return new TransformStream({
		flush(controller) {
			if (buffer.trim()) controller.enqueue(buffer)
		},
		transform(chunk, controller) {
			buffer += chunk

			const lines = buffer.split('\n')

			buffer = lines.pop() ?? ''

			for (const line of lines) {
				if (line.trim()) controller.enqueue(line)
			}
		},
	})
}
