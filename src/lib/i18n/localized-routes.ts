// ═══════════════════════════════════════════════════════════════════════════
//   Which paths carry the locale in the URL. Only the public pages do: they
//   are what a crawler indexes, once per language, at `/` and `/ru/`.
//
//   The app, sign-in and the API never resolve under a prefix. `/ru/api/…`
//   would slip past every rule written for `/api/`, and a private page has
//   nothing to gain from a second, unindexed address. They read the
//   PARAGLIDE_LOCALE cookie instead (see the route strategies in
//   vite.config.ts), which the landing writes on every visit.
//
//   The one list both sides read: this regex for the router and the
//   Paraglide route strategies in vite.config.ts, so the two zones cannot
//   drift apart. `_serverFn` is here because a server function runs in the
//   locale of its request, and its path matches no prefix.
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
