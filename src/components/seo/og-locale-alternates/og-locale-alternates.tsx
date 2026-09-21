import { usePathname } from '@/hooks/use-pathname'
import { locales, ogLocale } from '@/lib/i18n/locale'
import { isLocalizablePath } from '@/lib/i18n/localized-routes'
import { useLocale } from '@/lib/i18n/use-locale'

// ═══════════════════════════════════════════════════════════════════════════
//   Not in head(): HeadContent dedupes meta by property, which would
//   collapse the alternates into one.
// ═══════════════════════════════════════════════════════════════════════════
export function OgLocaleAlternates() {
	const locale = useLocale()
	const pathname = usePathname()

	if (!isLocalizablePath(pathname)) return null

	return locales
		.filter((candidate) => candidate !== locale)
		.map((candidate) => (
			<meta
				content={ogLocale(candidate)}
				key={candidate}
				property="og:locale:alternate"
			/>
		))
}
