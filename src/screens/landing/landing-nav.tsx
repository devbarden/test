import { HomeLink } from '@/components/brand'
import { LanguageSwitcher } from '@/components/locale/language-switcher'
import { ButtonLink } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import styles from './landing-nav.module.css'
import { LANDING_NAV } from './landing-sections'

// ═══════════════════════════════════════════════════════════════════════════
//   A floating plate rather than a full-width bar: it reads as part of the
//   page instead of browser chrome, and the dotted background stays visible
//   around it. The in-page links are plain fragments — they are the same
//   page in every language, and a crawler follows them as is.
// ═══════════════════════════════════════════════════════════════════════════
export function LandingNav() {
	return (
		<header className={styles.nav}>
			<div className={styles.plate}>
				<HomeLink className={styles.brand} />
				<nav aria-label={m['landing.nav.label']()} className={styles.links}>
					{LANDING_NAV.map((section) => (
						<a href={`#${section.id}`} key={section.id}>
							{section.label()}
						</a>
					))}
				</nav>
				<div className={styles.actions}>
					<LanguageSwitcher />
					<ButtonLink shape="pill" size="md" to="/applications">
						{m['landing.nav.start']()}
					</ButtonLink>
				</div>
			</div>
		</header>
	)
}
