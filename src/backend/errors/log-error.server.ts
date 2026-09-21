import type { Logger } from '../observability/logger.server'
import { type AppError, toAppError } from './app-error.server'

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
