import {
	defineRailway,
	github,
	image,
	postgres,
	preserve,
	project,
	redis,
	service,
	volume,
} from 'railway/iac'

const REGION = 'europe-west4-drams3a'

const VOLUME_ALERTS = { usage: { '80': {}, '95': {}, '100': {} } }

// ═══════════════════════════════════════════════════════════════════════════
//   The whole Railway project as code: two stateful services, the app and
//   the scheduled purge. `railway config plan` previews a change and
//   `railway config apply` makes it; nothing here is applied by a git push.
//
//   Values that are not secret live here; secrets are `preserve()` — they
//   are set once in Railway and never enter the repository. Connection
//   strings are references to the database services, so rotating a
//   password there reaches the app without editing anything.
// ═══════════════════════════════════════════════════════════════════════════
export default defineRailway(() => {
	const Postgres = postgres('Postgres', { region: REGION })
	Postgres.networking = { privateNetworkEndpoint: 'postgres' }

	const Redis = redis('Redis', { region: REGION })
	Redis.deploy = {
		startCommand:
			'/bin/sh -c "rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH"',
	}
	Redis.networking = { privateNetworkEndpoint: 'redis' }

	const postgresVolume = volume('postgres-volume', {
		alerts: VOLUME_ALERTS,
		allowOnlineResize: true,
		region: REGION,
		sizeMB: 50_000,
	})
	const redisVolume = volume('redis-volume', {
		alerts: VOLUME_ALERTS,
		allowOnlineResize: true,
		region: REGION,
		sizeMB: 50_000,
	})

	// ═════════════════════════════════════════════════════════════════════════
	//   Migrations run in pre-deploy, before the new version takes traffic,
	//   and traffic switches only once readiness (database reachable)
	//   passes — a release that cannot migrate or connect never goes live.
	//
	//   The old version is given time to finish what it started: a letter
	//   may stream for up to 90 s (config.generation.maxDurationMs) and is
	//   saved after that. The server drains for SERVER_SHUTDOWN_TIMEOUT
	//   seconds (srvx's default is 5) and Railway waits drainingSeconds
	//   (default 0) before SIGKILL — both are set past that bound, or every
	//   deploy would cut off the letters being written at that moment.
	// ═════════════════════════════════════════════════════════════════════════
	const app = service('test', {
		build: 'npm run build',
		deploy: {
			drainingSeconds: 100,
			limitOverride: { containers: { cpu: 4, memoryBytes: 4_000_000_000 } },
			restartPolicyMaxRetries: 3,
		},
		env: {
			CLERK_SECRET_KEY: preserve(),
			CLERK_WEBHOOK_SIGNING_SECRET: preserve(),
			CRON_SECRET: preserve(),
			DATABASE_URL: Postgres.env.DATABASE_URL,
			GENERATION_API_TOKEN: preserve(),
			GENERATION_API_URL: 'https://test-assignment-api.variant.net/v1/generate',
			LOG_LEVEL: 'info',
			NODE_ENV: 'production',
			REDIS_URL: Redis.env.REDIS_URL,
			SERVER_SHUTDOWN_TIMEOUT: '95',
			VITE_CLERK_PUBLISHABLE_KEY: preserve(),
			VITE_SITE_URL: preserve(),
		},
		healthcheck: '/api/health/ready',
		healthcheckTimeout: 120,
		preDeploy: 'npx prisma migrate deploy',
		replicas: { [REGION]: 1 },
		source: github('devbarden/test', { checkSuites: false }),
		start: 'npm run start',
	})

	// ═════════════════════════════════════════════════════════════════════════
	//   A one-shot container on a schedule: it calls the app over the private
	//   network and exits. The job itself lives in the app (/api/cron/:job),
	//   so it runs with the app's config, pool and logs.
	// ═════════════════════════════════════════════════════════════════════════
	const purgeCron = service('purge-cron', {
		deploy: { cronSchedule: '0 3 * * *', restartPolicyType: 'NEVER' },
		env: {
			APP_INTERNAL_URL: preserve(),
			CRON_SECRET: preserve(),
		},
		replicas: { [REGION]: 1 },
		source: image('curlimages/curl:8.10.1'),
		start:
			'sh -c \'curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_INTERNAL_URL/api/cron/purge-deleted-applications"\'',
	})

	return project('resilient-luck', {
		resources: [Postgres, app, purgeCron, Redis, redisVolume, postgresVolume],
	})
})
