import { describe, expect, it } from 'vitest'
import { PayloadTooLargeError } from '../errors/app-error.server'
import { withBodyLimit } from './request-body.server'

function chunkedRequest(bytes: number): Request {
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(bytes))
			controller.close()
		},
	})

	return new Request('http://localhost/upload', {
		body,
		duplex: 'half',
		method: 'POST',
	} as RequestInit & { duplex: 'half' })
}

describe('withBodyLimit', () => {
	it('refuses a declared length over the cap before reading anything', () => {
		const request = new Request('http://localhost/upload', {
			body: 'x'.repeat(20),
			headers: { 'content-length': '20' },
			method: 'POST',
		})

		expect(() => withBodyLimit(request, 10)).toThrow(PayloadTooLargeError)
	})

	it('cuts a chunked body off once it passes the cap', async () => {
		const limited = withBodyLimit(chunkedRequest(2048), 1024)

		await expect(limited.arrayBuffer()).rejects.toThrow()
	})

	it('passes a chunked body within the cap through untouched', async () => {
		const limited = withBodyLimit(chunkedRequest(512), 1024)

		expect((await limited.arrayBuffer()).byteLength).toBe(512)
	})
})
