import { useQuery } from '@tanstack/react-query'
import { HeaderStatus } from '@/components/layout/header-status'
import { ProgressRing } from '@/components/ui/progress-ring'
import { m } from '@/paraglide/messages'
import { billingQueries } from '../api/billing.queries'

export function DailyLetters() {
	const { data } = useQuery(billingQueries.overview())

	if (!data) return <HeaderStatus hideOnPhone />

	const limit = data.entitlements.dailyGenerations
	const used = Math.min(data.usage.generationsToday, limit)

	return (
		<HeaderStatus
			hideOnPhone
			indicator={
				<ProgressRing
					label={m['billing.lettersToday']()}
					max={limit}
					value={used}
					valueText={m['billing.usageValue']({ limit, used })}
				/>
			}
			suffix={m['billing.daily.suffix']()}
			value={`${used}/${limit}`}
		/>
	)
}
