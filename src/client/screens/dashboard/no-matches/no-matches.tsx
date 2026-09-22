import { SearchXIcon } from 'lucide-react'
import { Button } from '@/client/kit/button'
import { GhostCard } from '../ghost-card'
import { StatePanel } from '../state-panel'
import styles from './no-matches.module.css'

type NoMatchesProps = {
	onClear: () => void
	search: string
}

export function NoMatches({ onClear, search }: NoMatchesProps) {
	return (
		<StatePanel
			action={
				<Button onClick={onClear} variant="secondary">
					Clear search
				</Button>
			}
			description={`No application matches “${search}”. Try a different word.`}
			illustration={
				<span className={styles.scene}>
					<GhostCard className={styles.card} />
					<span className={styles.badge}>
						<SearchXIcon />
					</span>
				</span>
			}
			role="status"
			title="Nothing found"
		/>
	)
}
