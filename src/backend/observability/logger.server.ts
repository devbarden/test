import pino from 'pino'
import type { AppConfig } from '../config.server'

export type Logger = pino.Logger

// ═══════════════════════════════════════════════════════════════════════════
//   JSON lines on stdout: Railway indexes them as structured logs, so
//   `requestId`, `userId` and `err.code` become searchable fields instead of
//   text inside a message. Credentials are redacted by path, so a header or
//   a config object logged by accident cannot leak a token.
// ═══════════════════════════════════════════════════════════════════════════
export function createRootLogger({ config }: { config: AppConfig }): Logger {
	return pino({
		base: { service: 'alt-shift' },
		formatters: { level: (label) => ({ level: label }) },
		level: config.nodeEnv === 'test' ? 'silent' : config.logLevel,
		redact: {
			censor: '[redacted]',
			paths: [
				'*.authorization',
				'*.Authorization',
				'*.cookie',
				'*.apiToken',
				'*.token',
				'*.secret',
			],
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	})
}
