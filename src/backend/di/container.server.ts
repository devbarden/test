import { type AwilixContainer, createContainer, InjectionMode } from 'awilix'
import { accountModule } from '@/features/account/account.module.server'
import { applicationsModule } from '@/features/applications/applications.module.server'
import { billingModule } from '@/features/billing/billing.module.server'
import { generationModule } from '@/features/generation/generation.module.server'
import type { Actor, UserActor } from '../auth/actor'
import type { Logger } from '../observability/logger.server'
import { coreModule } from './core.module.server'
import type { CradleOf } from './module'

// ═══════════════════════════════════════════════════════════════════════════
//   `strict: true` turns a singleton that captures a scoped value (the first
//   request's user) into an error.
// ═══════════════════════════════════════════════════════════════════════════
const modules = {
	...coreModule,
	...accountModule,
	...applicationsModule,
	...billingModule,
	...generationModule,
}

type RequestCradle = {
	actor: Actor
	logger: Logger
	requestId: string
	userActor: UserActor
}

export type AppCradle = CradleOf<typeof modules> & RequestCradle

export type AppContainer = AwilixContainer<AppCradle>

let container: AppContainer | undefined

export function getAppContainer(): AppContainer {
	if (!container) {
		container = createContainer<AppCradle>({
			injectionMode: InjectionMode.PROXY,
			strict: true,
		})
		container.register(modules)
	}

	return container
}
