import { type AppError, toAppError } from '../errors.server'
import type { Logger } from '../observability/logger.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The single place a failure is logged, at the level it deserves: a 4xx is
//   the caller's problem and a warning; a 5xx is ours and an error, with the
//   original cause attached for the log only.
// ═══════════════════════════════════════════════════════════════════════════
export function logAndNormalizeError(error: unknown, logger: Logger): AppError {
	const appError = toAppError(error)

	if (appError.statusCode >= 500) {
		logger.error(
			{ code: appError.code, err: appError.cause ?? appError },
			'Request failed',
		)
	} else {
		logger.warn(
			{ code: appError.code, reason: appError.message },
			'Request refused',
		)
	}

	return appError
}
