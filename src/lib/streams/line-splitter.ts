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
