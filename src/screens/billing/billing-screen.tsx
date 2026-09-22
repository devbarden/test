import { PageHeader } from '@/components/layout/page-header'
import styles from './billing-screen.module.css'
import { PlanPicker } from './plan-picker/plan-picker'
import { UsageSummary } from './usage-summary/usage-summary'

export function BillingScreen() {
	return (
		<div className={styles.root}>
			<PageHeader title="Plan & billing" />
			<UsageSummary />
			<PlanPicker />
		</div>
	)
}
