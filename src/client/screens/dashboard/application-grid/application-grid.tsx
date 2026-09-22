import clsx from 'clsx'
import { ViewTransition } from 'react'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { ApplicationCard, ApplicationCardSkeleton } from '../application-card'
import styles from './application-grid.module.css'

const SKELETON_ROW = ['first', 'second'] as const

type ApplicationGridProps = {
	appendedFrom: number | undefined
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
//
//   Cards of a freshly loaded page arrive one after another through the
//   card's own CSS animation, so their view transition is switched off:
//   two entrance animations on one element would fight.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationGrid({
	appendedFrom,
	highlight,
	isLoadingMore,
	isStale,
	items,
	onDelete,
}: ApplicationGridProps) {
	const isLoadingFirst = items === undefined

	return (
		<ul
			aria-busy={isLoadingFirst || isLoadingMore || isStale || undefined}
			aria-label={isLoadingFirst ? 'Loading applications' : undefined}
			className={clsx(styles.root, isStale && styles.stale)}
		>
			{items?.map((application, index) => {
				const entrance = appendedFrom !== undefined && index >= appendedFrom ? index - appendedFrom : undefined

				return (
					<ViewTransition enter={entrance === undefined ? 'pop-in' : 'none'} exit="pop-out" key={application.id}>
						<li>
							<ApplicationCard
								application={application}
								entrance={entrance}
								highlight={highlight}
								onDelete={onDelete}
							/>
						</li>
					</ViewTransition>
				)
			})}
			{(isLoadingFirst || isLoadingMore) &&
				SKELETON_ROW.map((variant) => (
					<li aria-hidden="true" key={variant}>
						<ApplicationCardSkeleton variant={variant} />
					</li>
				))}
		</ul>
	)
}
