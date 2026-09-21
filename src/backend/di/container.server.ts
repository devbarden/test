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
//   The composition root — the one backend file allowed to know every
//   feature. Each module (infrastructure and one per feature) lists its own
//   registrations next to the code it wires, and this file only merges
//   them: a new feature adds one line here.
//
//   Lifetimes:
//   - singleton  config, clients, pools, gateways, rate limiter — process-wide
//   - scoped     services and repositories — one set per request, so they
//                can close over the request's actor and logger
//
//   `strict: true` makes a singleton that depends on something scoped a
//   resolution error rather than a silent capture of the first request's
//   user. `userActor` is registered only on user scopes
//   (request-scope.server.ts), so resolving a user-facing service from a
//   system scope fails loudly instead of running without an owner.
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
