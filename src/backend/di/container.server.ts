import { type AwilixContainer, createContainer, InjectionMode, type Resolver } from 'awilix'
import { accountModule } from '@/backend/modules/account/account.module.server'
import { applicationsModule } from '@/backend/modules/applications/applications.module.server'
import { billingModule } from '@/backend/modules/billing/billing.module.server'
import { generationModule } from '@/backend/modules/generation/generation.module.server'
import type { Actor, UserActor } from '../auth/actor'
import type { Logger } from '../observability/logger.server'
import { coreModule } from './core.module.server'

const modules = {
	...coreModule,
	...accountModule,
	...applicationsModule,
	...billingModule,
	...generationModule,
}

type CradleOf<Module extends Record<string, Resolver<unknown>>> = {
	[Name in keyof Module]: Module[Name] extends Resolver<infer Value> ? Value : never
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
