import { HomeLink } from '@/components/brand'
import { ButtonLink } from '@/components/ui/button'
import styles from './landing-nav.module.css'
import { LANDING_NAV } from './landing-sections'

export function LandingNav() {
	return (
		<header className={styles.root}>
			<div className={styles.plate}>
				<HomeLink className={styles.brand} />
				<nav aria-label="Main" className={styles.links}>
					{LANDING_NAV.map((section) => (
						<a className={styles.link} href={`#${section.id}`} key={section.id}>
							{section.label}
						</a>
					))}
				</nav>
				<div className={styles.actions}>
					<ButtonLink shape="pill" size="md" to="/app/applications">
						Get started
					</ButtonLink>
				</div>
			</div>
		</header>
	)
}
