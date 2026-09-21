import {
	PayloadTooLargeError,
	ValidationError,
} from '../errors/app-error.server'

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

// ═══════════════════════════════════════════════════════════════════════════
//   The server-wide body cap. A declared Content-Length is checked up front
//   (the HTTP parser then holds the body to it). A request that declares
//   none — a chunked upload — gets its body re-wrapped in a stream that
//   counts bytes and errors past the cap, so no handler can be made to
//   buffer an unbounded body, whatever it does with it. Browsers always
//   declare a length for the bodies this app sends, so the re-wrap only
//   ever applies to traffic that did not come from the app.
// ═══════════════════════════════════════════════════════════════════════════
export function withBodyLimit(request: Request, maxBytes: number): Request {
	const declared = request.headers.get('content-length')

	if (declared !== null) {
		if (Number(declared) > maxBytes) throw new PayloadTooLargeError()

		return request
	}

	if (!request.body) return request

	let received = 0
	const limited = request.body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				received += chunk.byteLength

				if (received > maxBytes) controller.error(new PayloadTooLargeError())
				else controller.enqueue(chunk)
			},
		}),
	)

	// ═════════════════════════════════════════════════════════════════════════
	//   Rebuilt field by field rather than as `new Request(request, …)`: the
	//   server hands in its own Request implementation, which the platform
	//   constructor cannot copy from.
	// ═════════════════════════════════════════════════════════════════════════
	return new Request(request.url, {
		body: limited,
		duplex: 'half',
		headers: request.headers,
		method: request.method,
		signal: request.signal,
	} as RequestInit & { duplex: 'half' })
}
