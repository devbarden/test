import {
	PayloadTooLargeError,
	ValidationError,
} from '../errors/app-error.server'

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
//   A chunked body declares no length, so it is counted as it streams.
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
	//   Not `new Request(request, …)`: the server's own Request cannot be
	//   copied by it.
	// ═════════════════════════════════════════════════════════════════════════
	return new Request(request.url, {
		body: limited,
		duplex: 'half',
		headers: request.headers,
		method: request.method,
		signal: request.signal,
	} as RequestInit & { duplex: 'half' })
}
