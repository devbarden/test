import { PayloadTooLargeError, ValidationError } from '../errors/app-error.server'

// ═══════════════════════════════════════════════════════════════════════════
//   `duplex` is required to send a streamed body and is in the Fetch
//   standard, but not yet in TypeScript's DOM types.
// ═══════════════════════════════════════════════════════════════════════════
declare global {
	interface RequestInit {
		duplex?: 'half'
	}
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
	if (!request.headers.get('content-type')?.includes('application/json')) {
		throw new ValidationError('Expected an application/json body')
	}

	const text = await withBodyLimit(request, maxBytes).text()

	try {
		return JSON.parse(text)
	} catch (cause) {
		throw new ValidationError('Body is not valid JSON', { cause })
	}
}

export function withBodyLimit(request: Request, maxBytes: number): Request {
	const declared = request.headers.get('content-length')

	if (Number(declared) > maxBytes) throw new PayloadTooLargeError()
	if (declared !== null || !request.body) return request

	// ═════════════════════════════════════════════════════════════════════════
	//   A chunked body declares no length, so it is counted as it streams.
	//   Not `new Request(request, …)`: the server's Request cannot be copied.
	// ═════════════════════════════════════════════════════════════════════════
	return new Request(request.url, {
		body: limitedBody(request.body, maxBytes),
		duplex: 'half',
		headers: request.headers,
		method: request.method,
		signal: request.signal,
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//   Never cancels the source: cancelling Node's request stream while the
//   client is still sending crashes the process (ERR_INVALID_STATE).
// ═══════════════════════════════════════════════════════════════════════════
function limitedBody(body: ReadableStream<Uint8Array>, maxBytes: number): ReadableStream<Uint8Array> {
	const reader = body.getReader()
	let received = 0

	return new ReadableStream<Uint8Array>({
		cancel: () => reader.releaseLock(),
		async pull(controller) {
			const { done, value } = await reader.read()

			if (done) return controller.close()

			received += value.byteLength

			if (received > maxBytes) {
				reader.releaseLock()
				return controller.error(new PayloadTooLargeError())
			}

			controller.enqueue(value)
		},
	})
}
