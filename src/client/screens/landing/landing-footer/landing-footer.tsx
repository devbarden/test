import { useId } from 'react'
import { Logo } from '@/client/components/logo'
import { Container } from '@/client/kit/container'
import { TextLink } from '@/client/kit/text-link'
import { LANDING_NAV } from '../landing-sections'
import styles from './landing-footer.module.css'

export function LandingFooter() {
	const productId = useId()

	return (
		<footer className={styles.root}>
			<Container className={styles.inner}>
				<div className={styles.brand}>
					<Logo />
					<p>A personal cover letter for every job you apply to.</p>
				</div>
				<nav aria-labelledby={productId} className={styles.column}>
					<h2 className={styles.columnTitle} id={productId}>
						Product
					</h2>
					{LANDING_NAV.map((section) => (
						<TextLink hash={section.id} key={section.id} to=".">
							{section.label}
						</TextLink>
					))}
				</nav>
			</Container>
		</footer>
	)
}
