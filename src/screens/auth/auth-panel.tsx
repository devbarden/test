import { useId } from 'react'
import { HomeLink } from '@/components/brand'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Heading } from '@/components/ui/heading'
import { PRODUCT_STEPS } from '@/features/marketing/model/product-content'
import { PRODUCT_STEP_ICONS } from '@/features/marketing/ui/product-icons'
import { m } from '@/paraglide/messages'
import styles from './auth-panel.module.css'

export function AuthPanel() {
	const stepsLabelId = useId()

	return (
		<aside className={styles.root}>
			<HomeLink className={styles.brand} />
			<div className={styles.copy}>
				<div className={styles.intro}>
					<Heading size="sm">{m['auth.title']()}</Heading>
					<p className={styles.description}>{m['auth.description']()}</p>
				</div>
				<div className={styles.steps}>
					<Eyebrow id={stepsLabelId}>{m['landing.steps.kicker']()}</Eyebrow>
					<ol aria-labelledby={stepsLabelId} className={styles.timeline}>
						{PRODUCT_STEPS.map((step) => {
							const Icon = PRODUCT_STEP_ICONS[step.id]

							return (
								<li className={styles.step} key={step.id}>
									<span className={styles.icon}>
										<Icon />
									</span>
									<div className={styles.stepCopy}>
										<h3 className={styles.stepTitle}>{step.title()}</h3>
										<p className={styles.stepBody}>{step.body()}</p>
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
