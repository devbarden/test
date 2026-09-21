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
import { createClerkWebhookHandler } from '../webhooks/clerk-webhook.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Infrastructure: process-wide singletons (config, clients, pools,
//   gateways, the limiter) plus the scoped entry points of the system
//   callers — the webhook handler and the job runner.
// ═══════════════════════════════════════════════════════════════════════════
export const coreModule = {
	clerkWebhookHandler: asFunction(createClerkWebhookHandler).scoped(),
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
