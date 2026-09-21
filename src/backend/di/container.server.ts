import {
	type AwilixContainer,
	asFunction,
	asValue,
	createContainer,
	InjectionMode,
} from 'awilix'
import {
	type ApplicationRepository,
	createApplicationRepository,
} from '@/features/applications/application.repository.server'
import {
	type ApplicationService,
	createApplicationService,
} from '@/features/applications/application.service.server'
import {
	type ApplicationMaintenanceService,
	createApplicationMaintenanceService,
} from '@/features/applications/application-maintenance.service.server'
import {
	createGenerationService,
	type GenerationService,
} from '@/features/generation/generation.service.server'
import { createLockService, type LockService } from '../cache/lock.server'
import { createRedisClient, type Redis } from '../cache/redis.server'
import { type AppConfig, createAppConfig } from '../config.server'
import {
	createPrismaClient,
	type PrismaClient,
} from '../database/prisma.server'
import {
	createGenerationApiGateway,
	type GenerationApiGateway,
} from '../gateways/generation-api/generation-api.gateway.server'
import {
	createHealthService,
	type HealthService,
} from '../lifecycle/health.server'
import { createRootLogger, type Logger } from '../observability/logger.server'
import { createRateLimiter, type RateLimiter } from '../web/rate-limit.server'
import type { Actor, UserActor } from './actor'

// ═══════════════════════════════════════════════════════════════════════════
//   The composition root: every service, repository and gateway is a plain
//   factory `createX({ deps })`, and this is the only file that knows how
//   they are wired.
//
//   Lifetimes:
//   - singleton  config, clients, pools, gateways, rate limiter — process-wide
//   - scoped     services and repositories — one set per request, so they
//                can close over the request's actor and logger
//
//   `strict: true` makes a singleton that depends on something scoped a
//   resolution error rather than a silent capture of the first request's
//   user. `userActor` is registered only on user scopes (scope.server.ts),
//   so resolving a user-facing service from a system scope fails loudly
//   instead of running without an owner.
// ═══════════════════════════════════════════════════════════════════════════
export type AppCradle = {
	actor: Actor
	applicationMaintenanceService: ApplicationMaintenanceService
	applicationRepository: ApplicationRepository
	applicationService: ApplicationService
	config: AppConfig
	db: PrismaClient
	generationApiGateway: GenerationApiGateway
	generationService: GenerationService
	healthService: HealthService
	lockService: LockService
	logger: Logger
	rateLimiter: RateLimiter
	redis: Redis
	requestId: string
	rootLogger: Logger
	userActor: UserActor
}

export type AppContainer = AwilixContainer<AppCradle>

function buildContainer(): AppContainer {
	const container = createContainer<AppCradle>({
		injectionMode: InjectionMode.PROXY,
		strict: true,
	})

	container.register({
		applicationMaintenanceService: asFunction(
			createApplicationMaintenanceService,
		).scoped(),
		applicationRepository: asFunction(createApplicationRepository).scoped(),
		applicationService: asFunction(createApplicationService).scoped(),
		config: asValue(createAppConfig()),
		db: asFunction(createPrismaClient).singleton(),
		generationApiGateway: asFunction(createGenerationApiGateway).singleton(),
		generationService: asFunction(createGenerationService).scoped(),
		healthService: asFunction(createHealthService).singleton(),
		lockService: asFunction(createLockService).singleton(),
		rateLimiter: asFunction(createRateLimiter).singleton(),
		redis: asFunction(createRedisClient).singleton(),
		rootLogger: asFunction(createRootLogger).singleton(),
	})

	return container
}

let container: AppContainer | undefined

export function getAppContainer(): AppContainer {
	container ??= buildContainer()

	return container
}
