import { asFunction, asValue } from 'awilix'
import { createAppConfig } from '../config.server'
import { createPrismaClient } from '../database/prisma.server'
import { createGenerationApiGateway } from '../gateways/generation-api.gateway.server'
import { createRootLogger } from '../observability/logger.server'
import { createRateLimiter } from '../rate-limit/rate-limiter.server'
import { createLockService } from '../redis/lock.server'
import { createRedisClient } from '../redis/redis.server'
import { createClerkWebhookVerifier } from '../webhooks/clerk-webhook-verifier.server'

export const coreModule = {
	clerkWebhookVerifier: asFunction(createClerkWebhookVerifier).singleton(),
	config: asValue(createAppConfig()),
	db: asFunction(createPrismaClient).singleton(),
	generationApiGateway: asFunction(createGenerationApiGateway).singleton(),
	lockService: asFunction(createLockService).singleton(),
	rateLimiter: asFunction(createRateLimiter).singleton(),
	redis: asFunction(createRedisClient).singleton(),
	rootLogger: asFunction(createRootLogger).singleton(),
}
