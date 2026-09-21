// ═══════════════════════════════════════════════════════════════════════════
//   Integration tests truncate tables and flush Redis between cases, so the
//   URLs they use are pinned to the disposable docker services and refused
//   if they point anywhere else — a misconfigured variable must not be able
//   to aim a TRUNCATE at a real database.
// ═══════════════════════════════════════════════════════════════════════════
export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	'postgresql://alt_shift:alt_shift@localhost:5436/alt_shift_test'

export const TEST_REDIS_URL =
	process.env.TEST_REDIS_URL ?? 'redis://localhost:6380/1'

export function assertDisposable(url: string): void {
	const { hostname, pathname } = new URL(url)
	const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
	const isTestTarget =
		pathname.includes('test') || /^\/[1-9]\d*$/.test(pathname)

	if (!isLocal || !isTestTarget) {
		throw new Error(
			`Refusing to run integration tests against ${hostname}${pathname}`,
		)
	}
}
