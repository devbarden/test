import { HomeLink } from '@/components/brand'
import { LanguageSwitcher } from '@/components/locale/language-switcher'
import { ButtonLink } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import styles from './landing-nav.module.css'
import { LANDING_NAV } from './landing-sections'

export function LandingNav() {
	return (
		<header className={styles.root}>
			<div className={styles.plate}>
				<HomeLink className={styles.brand} />
				<nav aria-label={m['landing.nav.label']()} className={styles.links}>
					{LANDING_NAV.map((section) => (
						<a className={styles.link} href={`#${section.id}`} key={section.id}>
							{section.label()}
						</a>
					))}
				</nav>
				<div className={styles.actions}>
					<LanguageSwitcher variant="ghost" />
					<ButtonLink shape="pill" size="md" to="/app/applications">
						{m['landing.nav.start']()}
					</ButtonLink>
				</div>
			</div>
		</header>
	)
}
