import { PageHeader } from '@/client/kit/page-header'
import { PlanPicker } from '../plan-picker'
import { UsageSummary } from '../usage-summary'
import styles from './billing-screen.module.css'

export function BillingScreen() {
	return (
		<div className={styles.root}>
			<PageHeader title="Plan & billing" />
			<UsageSummary />
			<PlanPicker />
		</div>
	)
}
