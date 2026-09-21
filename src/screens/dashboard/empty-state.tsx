import { Heading } from '@/components/ui/heading'
import { Panel } from '@/components/ui/panel'
import { m } from '@/paraglide/messages'
import styles from './empty-state.module.css'

const GHOST_CARDS = ['first', 'second'] as const

const GHOST_LINES = ['heading', 'one', 'two', 'three', 'four', 'five'] as const

// ═══════════════════════════════════════════════════════════════════════════
//   No call to action of its own: the goal banner right below it carries
//   "Create New", and so does the page header. A third identical button
//   would only compete with them. This block's job is to show what WILL be
//   here — the ghost cards are blank letters — and to lower
//   the bar to starting.
// ═══════════════════════════════════════════════════════════════════════════
export function EmptyState() {
	return (
		<Panel className={styles.root}>
			<div aria-hidden="true" className={styles.illustration}>
				{GHOST_CARDS.map((key) => (
					<div className={styles.ghostCard} key={key}>
						{GHOST_LINES.map((line) => (
							<span className={styles.ghostLine} key={line} />
						))}
					</div>
				))}
			</div>
			<Heading className={styles.title} size="sm">
				{m['dashboard.empty.title']()}
			</Heading>
			<p className={styles.description}>{m['dashboard.empty.description']()}</p>
		</Panel>
	)
}
