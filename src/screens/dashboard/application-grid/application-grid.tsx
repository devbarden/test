import clsx from 'clsx'
import { ViewTransition } from 'react'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { ApplicationCard } from '../application-card/application-card'
import { ApplicationCardSkeleton } from '../application-card/application-card-skeleton'
import styles from './application-grid.module.css'

const SKELETON_ROW = ['first', 'second'] as const

type ApplicationGridProps = {
	highlight: readonly string[]
	isLoadingMore: boolean
	isStale: boolean
	items: readonly ApplicationDto[] | undefined
	onDelete: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   One list for every state: a row of skeletons while the first page
//   loads (no items yet) and again under the cards while the next one
//   does. It stays mounted while empty, so the last card can animate out
//   on its own instead of with the list around it.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationGrid({ highlight, isLoadingMore, isStale, items, onDelete }: ApplicationGridProps) {
	const isLoadingFirst = items === undefined

	return (
		<ul
			aria-busy={isLoadingFirst || isLoadingMore || isStale || undefined}
			aria-label={isLoadingFirst ? 'Loading applications' : undefined}
			className={clsx(styles.root, isStale && styles.stale)}
		>
			{items?.map((application) => (
				<ViewTransition enter="pop-in" exit="pop-out" key={application.id}>
					<li>
						<ApplicationCard application={application} highlight={highlight} onDelete={onDelete} />
					</li>
				</ViewTransition>
			))}
			{(isLoadingFirst || isLoadingMore) &&
				SKELETON_ROW.map((key) => (
					<li aria-hidden="true" key={key}>
						<ApplicationCardSkeleton />
					</li>
				))}
		</ul>
	)
}
