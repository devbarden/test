import { LandingFooter } from './landing-footer'
import { LandingNav } from './landing-nav'
import styles from './landing-screen.module.css'
import { Faq } from './sections/faq'
import { Features } from './sections/features'
import { Hero } from './sections/hero'
import { HowItWorks } from './sections/how-it-works'

export function LandingScreen() {
	return (
		<div className={styles.root}>
			<LandingNav />
			<main>
				<Hero />
				<HowItWorks />
				<Features />
				<Faq />
			</main>
			<LandingFooter />
		</div>
	)
}
