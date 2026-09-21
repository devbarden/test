export type SseEvent = {
	data: string
	event: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   A line — or an event, which is its `data` lines together — longer than
//   this is not a delta but a broken or hostile stream. The parser fails it
//   rather than buffering forever while waiting for a line break, or a
//   blank line, that never comes.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_LENGTH = 64 * 1024

// ═══════════════════════════════════════════════════════════════════════════
//   A Server-Sent Events parser as a TransformStream<string, SseEvent>,
//   following the WHATWG "event stream interpretation" rules:
//
//   - A line ends at CR, LF or CRLF — and a CRLF may be split across two
//     network chunks, so a trailing CR is held until the next chunk shows
//     whether an LF follows it (or the stream ends, which settles it too).
//   - A line starting with ':' is a comment. The Generation API opens every
//     stream with `: keepalive`, which the published spec does not mention.
//   - `data` lines accumulate (joined by LF); a blank line dispatches the
//     event, unless no data was collected.
//   - An event cut off by the end of the stream is DISCARDED, as the spec
//     requires: a half-received `data:` line is exactly what a dropped
//     connection looks like, and it must not be parsed as if it were whole.
//
//   Hand-written rather than pulled in: it is ~60 lines, it is the one piece
//   of the integration whose edge cases decide whether a letter arrives
//   intact, and owning it is what lets the tests pin those edge cases down.
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
