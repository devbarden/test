import { describe, expect, it } from 'vitest'
import { toAppError } from '@/backend/errors/app-error.server'
import { applicationIdSchema } from '@/features/applications/model/application.schema'
import { validateInput } from './validate-input'

describe('validateInput', () => {
	it('returns the parsed input', () => {
		const id = '01900000-0000-7000-8000-000000000001'

		expect(validateInput(applicationIdSchema)({ id })).toEqual({ id })
	})

	it("reports malformed input as the caller's mistake, not ours", () => {
		const failure = (() => {
			try {
				validateInput(applicationIdSchema)({ id: 'not-a-uuid' })
			} catch (error) {
				return error
			}
		})()

		expect(toAppError(failure).toPayload()).toEqual({ code: 'invalid_request' })
		expect(toAppError(failure).statusCode).toBe(400)
	})
})
