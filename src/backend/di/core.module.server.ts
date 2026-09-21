import { asFunction, asValue } from 'awilix'
import { createAppConfig } from '../config.server'
import { createPrismaClient } from '../database/prisma.server'
import { createGenerationApiGateway } from '../gateways/generation-api/generation-api.gateway.server'
import { createJobRunner } from '../jobs/job-runner.server'
import { createHealthService } from '../lifecycle/health.server'
import { createRootLogger } from '../observability/logger.server'
import { createRateLimiter } from '../rate-limit/rate-limiter.server'
import { createLockService } from '../redis/lock.server'
import { createRedisClient } from '../redis/redis.server'
import { createClerkWebhookVerifier } from '../webhooks/clerk-webhook-verifier.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Infrastructure — nothing here knows a feature. Process-wide singletons
//   (config, clients, pools, gateways, the limiter, the lock) plus the job
//   runner, which is scoped only because it logs with the request's logger.
// ═══════════════════════════════════════════════════════════════════════════
export const coreModule = {
	clerkWebhookVerifier: asFunction(createClerkWebhookVerifier).singleton(),
	config: asValue(createAppConfig()),
	db: asFunction(createPrismaClient).singleton(),
	generationApiGateway: asFunction(createGenerationApiGateway).singleton(),
	healthService: asFunction(createHealthService).singleton(),
	jobRunner: asFunction(createJobRunner).scoped(),
	lockService: asFunction(createLockService).singleton(),
	rateLimiter: asFunction(createRateLimiter).singleton(),
	redis: asFunction(createRedisClient).singleton(),
	rootLogger: asFunction(createRootLogger).singleton(),
}
