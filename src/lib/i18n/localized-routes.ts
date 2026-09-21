// ═══════════════════════════════════════════════════════════════════════════
//   Also read by Paraglide's route strategies in vite.config.ts. `_serverFn`
//   is here because a server function runs in its request's locale.
// ═══════════════════════════════════════════════════════════════════════════
export const UNLOCALIZED_PREFIXES = [
	'_serverFn',
	'api',
	'app',
	'sign-in',
	'sign-up',
] as const

const UNLOCALIZED_PATH = new RegExp(
	`^/(?:${UNLOCALIZED_PREFIXES.join('|')})(?:/|$)`,
)

export function isUnlocalizedPath(pathname: string): boolean {
	return UNLOCALIZED_PATH.test(pathname)
}

export function isLocalizablePath(pathname: string): boolean {
	return !isUnlocalizedPath(pathname)
}
