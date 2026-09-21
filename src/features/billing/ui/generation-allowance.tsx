import { useQuery } from '@tanstack/react-query'
import { TextLink } from '@/components/ui/text-link'
import { m } from '@/paraglide/messages'
import { billingQueries } from '../api/billing.queries'
import { FULL_ENTITLEMENTS } from '../model/billing.catalog'
import styles from './generation-allowance.module.css'

const LOW_ALLOWANCE = 3

// ═══════════════════════════════════════════════════════════════════════════
//   How many letters are left today, under the button that spends them —
//   shown only once the allowance runs low, so the everyday form is the
//   mockup's, and announced politely when it changes after a letter. The
//   upgrade link appears only while there is a bigger allowance to offer,
//   decided by the quota the user has, not by a plan name.
// ═══════════════════════════════════════════════════════════════════════════
export function GenerationAllowance() {
	const { data } = useQuery(billingQueries.overview())

	if (!data) return null

	const limit = data.entitlements.dailyGenerations
	const extendedLimit = FULL_ENTITLEMENTS.dailyGenerations
	const remaining = Math.max(0, limit - data.usage.generationsToday)
	const offerUpgrade = limit < extendedLimit

	if (remaining > LOW_ALLOWANCE) return null

	return (
		<p aria-live="polite" className={styles.allowance}>
			<span className={remaining === 0 ? styles.exhausted : undefined}>
				{remaining === 0
					? m['editor.allowance.none']()
					: m['editor.allowance.remaining']({ limit, remaining })}
			</span>
			{offerUpgrade && (
				<TextLink to="/applications/billing">
					{m['editor.allowance.upgrade']({ limit: extendedLimit })}
				</TextLink>
			)}
		</p>
	)
}
