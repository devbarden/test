import { UpstreamError } from '../../errors/app-error.server'

const TRANSIENT_STATUSES = new Set([408, 425, 500, 502, 503, 504])

const DEFAULT_RETRY_AFTER_SECONDS = 60

export function isTransient(error: unknown): boolean {
	return error instanceof UpstreamError && error.transient
}

// ═══════════════════════════════════════════════════════════════════════════
//   A caller that left mid-request gets a plain failure, not a retry.
// ═══════════════════════════════════════════════════════════════════════════
export function toUpstreamError(error: unknown, signal: AbortSignal): UpstreamError {
	if (error instanceof UpstreamError) return error

	return new UpstreamError('unavailable', 'Generation API unreachable', {
		cause: error,
		transient: !signal.aborted,
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//   An unread error body keeps the provider connection busy until GC.
// ═══════════════════════════════════════════════════════════════════════════
export function refusalError(response: Response): UpstreamError {
	response.body?.cancel().catch(() => {})

	if (response.status === 429) {
		const seconds = Number(response.headers.get('retry-after'))

		return new UpstreamError('rate_limited', 'Generation API rate limited', {
			retryAfterSeconds: seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS,
		})
	}

	return new UpstreamError('unavailable', `Generation API responded ${response.status}`, {
		transient: TRANSIENT_STATUSES.has(response.status),
	})
}
