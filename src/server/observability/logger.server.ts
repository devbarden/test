import pino from 'pino'

export type Logger = pino.Logger

export function createRootLogger(): Logger {
	return pino({
		base: { service: 'alt-shift' },
		formatters: { level: (label) => ({ level: label }) },
		level: 'info',
		redact: {
			censor: '[redacted]',
			paths: ['*.authorization', '*.Authorization', '*.cookie', '*.apiToken', '*.token', '*.secret'],
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	})
}
