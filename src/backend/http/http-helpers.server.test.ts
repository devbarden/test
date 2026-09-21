import { describe, expect, it } from 'vitest'
import { getClientIp, UNKNOWN_CLIENT_IP } from './client-ip.server'
import { asPermanentIfSpelling } from './permanent-redirect.server'
import { requestIdFrom } from './request-id.server'

const redirect = (location: string, status = 307) =>
	new Response(null, { headers: { Location: location }, status })

describe('getClientIp', () => {
	it('trusts only the rightmost X-Forwarded-For entry', () => {
		const headers = new Headers({ 'x-forwarded-for': '6.6.6.6, 10.0.0.1' })

		expect(getClientIp(headers)).toBe('10.0.0.1')
	})

	it('never returns an empty key', () => {
		expect(getClientIp(new Headers({ 'x-forwarded-for': ' , ' }))).toBe(
			UNKNOWN_CLIENT_IP,
		)
		expect(getClientIp(new Headers({ 'x-real-ip': '  ' }))).toBe(
			UNKNOWN_CLIENT_IP,
		)
	})
})

describe('requestIdFrom', () => {
	it('keeps a plain edge id and replaces anything else', () => {
		const plain = new Headers({ 'x-railway-request-id': 'abc_123.x-y' })
		const forged = 'id with spaces <script>'
		const oversized = 'x'.repeat(129)

		expect(requestIdFrom(plain)).toBe('abc_123.x-y')
		expect(
			requestIdFrom(new Headers({ 'x-railway-request-id': forged })),
		).not.toBe(forged)
		expect(
			requestIdFrom(new Headers({ 'x-railway-request-id': oversized })),
		).not.toBe(oversized)
	})
})

describe('asPermanentIfSpelling', () => {
	const request = new Request('https://altshift.app/ru')

	it('makes a redirect to the same page, spelled right, permanent', () => {
		expect(asPermanentIfSpelling(request, redirect('/ru/')).status).toBe(308)
	})

	it('leaves a redirect to another page temporary', () => {
		expect(asPermanentIfSpelling(request, redirect('/sign-in')).status).toBe(
			307,
		)
	})
})
