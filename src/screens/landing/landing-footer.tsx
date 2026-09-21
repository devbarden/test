import { useId } from 'react'
import { Logo } from '@/components/brand'
import { Container } from '@/components/layout/container'
import { TextLink } from '@/components/ui/text-link'
import { usePathname } from '@/hooks/use-pathname'
import { LOCALE_NAMES, locales } from '@/lib/i18n/locale'
import { m } from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'
import styles from './landing-footer.module.css'
import { LANDING_NAV } from './landing-sections'

// ═══════════════════════════════════════════════════════════════════════════
//   The language links are plain anchors on purpose: they are how a
//   crawler that never clicks the switcher still finds every translation
//   from every page, alongside the hreflang tags in the head.
// ═══════════════════════════════════════════════════════════════════════════
export function LandingFooter() {
	const pathname = usePathname()
	const productId = useId()
	const languagesId = useId()

	return (
		<footer className={styles.root}>
			<Container className={styles.inner}>
				<div className={styles.brand}>
					<Logo />
					<p>{m['landing.footer.tagline']()}</p>
				</div>
				<nav aria-labelledby={productId} className={styles.column}>
					<h2 className={styles.columnTitle} id={productId}>
						{m['landing.footer.product']()}
					</h2>
					{LANDING_NAV.map((section) => (
						<TextLink hash={section.id} key={section.id} to="." tone="muted">
							{section.label()}
						</TextLink>
					))}
				</nav>
				<nav aria-labelledby={languagesId} className={styles.column}>
					<h2 className={styles.columnTitle} id={languagesId}>
						{m['landing.footer.languages']()}
					</h2>
					{locales.map((locale) => (
						<a
							className={styles.language}
							href={localizeHref(pathname, { locale })}
							hrefLang={locale}
							key={locale}
							lang={locale}
						>
							{LOCALE_NAMES[locale]}
						</a>
					))}
				</nav>
			</Container>
		</footer>
	)
}
