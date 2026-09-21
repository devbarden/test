import { PayloadTooLargeError, ValidationError } from '../errors.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Reads a JSON body without trusting the client about its size: the
//   declared Content-Length is checked first (cheap refusal), and the bytes
//   are then counted as they arrive, cancelling the read the moment the cap
//   is passed — a chunked upload that declares nothing cannot make us
//   buffer more than `maxBytes`.
// ═══════════════════════════════════════════════════════════════════════════
export async function readJsonBody(
	request: Request,
	maxBytes: number,
): Promise<unknown> {
	if (!request.headers.get('content-type')?.includes('application/json')) {
		throw new ValidationError('Expected an application/json body')
	}

	if (Number(request.headers.get('content-length') ?? 0) > maxBytes) {
		throw new PayloadTooLargeError()
	}

	const text = await readCappedText(request, maxBytes)

	try {
		return JSON.parse(text)
	} catch (cause) {
		throw new ValidationError('Body is not valid JSON', { cause })
	}
}

async function readCappedText(
	request: Request,
	maxBytes: number,
): Promise<string> {
	if (!request.body) return ''

	const reader = request.body.getReader()
	const decoder = new TextDecoder()
	let received = 0
	let text = ''

	for (;;) {
		const { done, value } = await reader.read()

		if (done) return text + decoder.decode()

		received += value.byteLength

		if (received > maxBytes) {
			await reader.cancel()
			throw new PayloadTooLargeError()
		}

		text += decoder.decode(value, { stream: true })
	}
}
