import {
	PayloadTooLargeError,
	ValidationError,
} from '../errors/app-error.server'

// ═══════════════════════════════════════════════════════════════════════════
//   `duplex` is required to send a streamed body and is in the Fetch
//   standard, but not yet in TypeScript's DOM types.
// ═══════════════════════════════════════════════════════════════════════════
declare global {
	interface RequestInit {
		duplex?: 'half'
	}
}

export async function readJsonBody(
	request: Request,
	maxBytes: number,
): Promise<unknown> {
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
		body: request.body.pipeThrough(byteLimit(maxBytes)),
		duplex: 'half',
		headers: request.headers,
		method: request.method,
		signal: request.signal,
	})
}

function byteLimit(maxBytes: number) {
	let received = 0

	return new TransformStream<Uint8Array, Uint8Array>({
		transform(chunk, controller) {
			received += chunk.byteLength

			if (received > maxBytes) throw new PayloadTooLargeError()

			controller.enqueue(chunk)
		},
	})
}
