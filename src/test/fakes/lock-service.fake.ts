import { vi } from 'vitest'
import type { LockService } from '@/backend/redis/lock.server'

export function createFakeLockService({ held = false } = {}) {
	const state = { acquired: 0, released: 0 }

	const lockService: LockService = {
		acquire: vi.fn(async () => {
			if (held) return null
			state.acquired += 1

			let released = false

			return {
				release: async () => {
					if (released) return
					released = true
					state.released += 1
				},
			}
		}),
	}

	return { lockService, state }
}
