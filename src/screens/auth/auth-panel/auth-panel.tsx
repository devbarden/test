import { useId } from 'react'
import { HomeLink } from '@/components/brand'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Heading } from '@/components/ui/heading'
import { PRODUCT_STEPS } from '@/features/marketing/ui/product-content'
import { PRODUCT_STEP_ICONS } from '@/features/marketing/ui/product-icons'
import { BRAND_NAME } from '@/lib/document/brand'
import styles from './auth-panel.module.css'

export function AuthPanel() {
	const stepsLabelId = useId()

	return (
		<aside className={styles.root}>
			<HomeLink className={styles.brand} />
			<div className={styles.copy}>
				<div className={styles.intro}>
					<Heading size="sm">Your next cover letter is a minute away</Heading>
					<p className={styles.description}>
						Sign in or create an account with the same form — {BRAND_NAME} writes a personal cover letter for every job
						you apply to.
					</p>
				</div>
				<div className={styles.steps}>
					<Eyebrow id={stepsLabelId}>How it works</Eyebrow>
					<ol aria-labelledby={stepsLabelId} className={styles.timeline}>
						{PRODUCT_STEPS.map((step) => {
							const Icon = PRODUCT_STEP_ICONS[step.id]

							return (
								<li className={styles.step} key={step.id}>
									<span className={styles.icon}>
										<Icon />
									</span>
									<div className={styles.stepCopy}>
										<h3 className={styles.stepTitle}>{step.title}</h3>
										<p className={styles.stepBody}>{step.body}</p>
									</div>
								</li>
							)
						})}
					</ol>
				</div>
			</div>
		</aside>
	)
}
