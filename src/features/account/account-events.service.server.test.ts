import { describe, expect, it, vi } from 'vitest'
import type { ClerkWebhookEvent } from '@/backend/webhooks/clerk-webhook-verifier.server'
import { silentLogger } from '@/test/fixtures'
import { createAccountEventsService } from './account-events.service.server'

function setup() {
	const eraseUser = vi.fn(async () => 0)
	const record = vi.fn()
	const service = createAccountEventsService({
		applicationMaintenanceService: {
			eraseUser,
			purgeDeleted: vi.fn(async () => 0),
		},
		billingWebhookService: { record },
		logger: silentLogger,
	})

	return { eraseUser, record, service }
}

const event = (type: string, data: Record<string, unknown>) =>
	({ data, object: 'event', type }) as unknown as ClerkWebhookEvent

describe('accountEventsService', () => {
	it("erases a deleted user's letters", async () => {
		const { eraseUser, record, service } = setup()

		await service.handle(event('user.deleted', { id: 'user_1' }))

		expect(eraseUser).toHaveBeenCalledWith('user_1')
		expect(record).not.toHaveBeenCalled()
	})

	it('records billing events without touching letters', async () => {
		const { eraseUser, record, service } = setup()

		await service.handle(event('subscription.pastDue', { status: 'past_due' }))

		expect(record).toHaveBeenCalledOnce()
		expect(eraseUser).not.toHaveBeenCalled()
	})

	it('ignores events it has no use for', async () => {
		const { eraseUser, record, service } = setup()

		await service.handle(event('user.created', { id: 'user_1' }))

		expect(eraseUser).not.toHaveBeenCalled()
		expect(record).not.toHaveBeenCalled()
	})
})
