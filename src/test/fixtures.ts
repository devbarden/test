import pino from 'pino'
import { type AppConfig, createAppConfig } from '@/backend/config.server'
import type { UserActor } from '@/backend/di/actor'
import {
	type Entitlements,
	FREE_ENTITLEMENTS,
} from '@/features/billing/billing.catalog'

export const silentLogger = pino({ level: 'silent' })

export function testConfig(): AppConfig {
	return createAppConfig({
		CLERK_SECRET_KEY: 'sk_test',
		DATABASE_URL: 'postgresql://localhost:5436/alt_shift_test',
		GENERATION_API_TOKEN: 'tok_test',
		NODE_ENV: 'test',
		REDIS_URL: 'redis://localhost:6380',
	})
}

export function testUser(
	userId = 'user_test',
	entitlements: Partial<Entitlements> = {},
): UserActor {
	return {
		entitlements: { ...FREE_ENTITLEMENTS, ...entitlements },
		plan: 'free',
		type: 'user',
		userId,
	}
}

export async function* fragments(...texts: string[]): AsyncGenerator<string> {
	yield* texts
}
