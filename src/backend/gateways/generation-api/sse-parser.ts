export type SseEvent = {
	data: string
	event: string
}

const MAX_LENGTH = 64 * 1024

// ═══════════════════════════════════════════════════════════════════════════
//   WHATWG rules. A CR at a chunk's end waits for a possible LF; an event cut
//   off by the end of the stream is discarded.
// ═══════════════════════════════════════════════════════════════════════════
export function createSseParser(): TransformStream<string, SseEvent> {
	let buffer = ''
	let eventName = ''
	let dataLines: string[] = []
	let dataLength = 0

	const dispatch = (controller: TransformStreamDefaultController<SseEvent>) => {
		if (dataLines.length > 0) {
			controller.enqueue({
				data: dataLines.join('\n'),
				event: eventName || 'message',
			})
		}

		eventName = ''
		dataLines = []
		dataLength = 0
	}

	const processLine = (
		line: string,
		controller: TransformStreamDefaultController<SseEvent>,
	) => {
		if (line === '') {
			dispatch(controller)
			return
		}

		if (line.startsWith(':')) return

		const colon = line.indexOf(':')
		const field = colon === -1 ? line : line.slice(0, colon)
		const rawValue = colon === -1 ? '' : line.slice(colon + 1)
		const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue

		if (field === 'event') eventName = value
		if (field === 'data') {
			dataLines.push(value)
			dataLength += value.length
		}
	}

	return new TransformStream({
		flush(controller) {
			if (buffer.endsWith('\r')) processLine(buffer.slice(0, -1), controller)
		},
		transform(chunk, controller) {
			buffer += chunk

			const endsWithCr = buffer.endsWith('\r')
			const complete = endsWithCr ? buffer.slice(0, -1) : buffer
			const lines = complete.split(/\r\n|\r|\n/)

			buffer = (lines.pop() ?? '') + (endsWithCr ? '\r' : '')

			for (const line of lines) processLine(line, controller)

			if (buffer.length > MAX_LENGTH || dataLength > MAX_LENGTH) {
				controller.error(new Error('SSE event exceeds the length limit'))
			}
		},
	})
}
