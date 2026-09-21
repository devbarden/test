import { deLocalizeUrl, localizeUrl } from '@/paraglide/runtime'
import { isLocalizablePath, isUnlocalizedPath } from './localized-routes'

// ═══════════════════════════════════════════════════════════════════════════
//   `/ru/…` resolves to the same route, except in the app zone, where it
//   stays a 404 instead of becoming a second URL for one page.
// ═══════════════════════════════════════════════════════════════════════════
function delocalize(url: URL): URL {
	if (isUnlocalizedPath(url.pathname)) return url

	const delocalized = deLocalizeUrl(url)

	return isUnlocalizedPath(delocalized.pathname) ? url : delocalized
}

export const localeRewrite = {
	input: ({ url }: { url: URL }) => delocalize(url),
	output: ({ url }: { url: URL }) =>
		isLocalizablePath(url.pathname) ? localizeUrl(url) : url,
}
