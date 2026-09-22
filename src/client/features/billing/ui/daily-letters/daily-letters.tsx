import { useQuery } from '@tanstack/react-query'
import { HeaderStatus } from '@/client/kit/header-status'
import { ProgressRing } from '@/client/kit/progress-ring'
import { billingQueries } from '../../api/billing.queries'

export function DailyLetters() {
	const { data } = useQuery(billingQueries.overview())

	if (!data) return <HeaderStatus hideOnPhone />

	const limit = data.entitlements.dailyGenerations
	const used = Math.min(data.usage.generationsInWindow, limit)

	return (
		<HeaderStatus
			hideOnPhone
			indicator={
				<ProgressRing label="Letters in the last 24 hours" max={limit} value={used} valueText={`${used} of ${limit}`} />
			}
			suffix="letters in 24 h"
			value={`${used}/${limit}`}
		/>
	)
}
