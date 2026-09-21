import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Highlight } from '@/components/ui/highlight'
import { Panel } from '@/components/ui/panel'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { applicationLabel } from '@/domain/applications/application-title'
import styles from './application-card.module.css'

type ApplicationCardProps = {
	application: ApplicationDto
	highlight?: readonly string[]
	onDelete: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   Buttons sit above one stretched link: buttons inside an <a> are invalid
//   HTML.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCard({
	application,
	highlight = [],
	onDelete,
}: ApplicationCardProps) {
	const title = applicationLabel(application.input)

	return (
		<Panel className={styles.root} data-application-id={application.id}>
			<Link
				className={styles.link}
				params={{ applicationId: application.id }}
				to="/app/applications/$applicationId"
			>
				<span className="visually-hidden">{`Open ${title}`}</span>
			</Link>
			<p className={styles.preview}>
				<Highlight
					terms={highlight}
					text={application.letter.replace(/\n\s*\n/g, '\n')}
				/>
			</p>
			<div className={styles.actions}>
				<Button
					iconStart={<Trash2Icon />}
					onClick={() => onDelete(application)}
					variant="ghost"
				>
					Delete
					<span className="visually-hidden">{`: ${title}`}</span>
				</Button>
				<CopyButton subject={title} text={application.letter} />
			</div>
		</Panel>
	)
}

export function cardLinkSelector(id: string): string {
	return `[data-application-id="${id}"] a`
}
