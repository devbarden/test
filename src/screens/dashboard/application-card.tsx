import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Panel } from '@/components/ui/panel'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import { applicationTitle } from '@/features/applications/model/application-title'
import { m } from '@/paraglide/messages'
import styles from './application-card.module.css'

type ApplicationCardProps = {
	application: ApplicationDto
	onDelete: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   The whole card opens the application, through one link stretched over
//   it, while Delete and Copy sit above that link. Nesting the buttons
//   inside an <a> instead would be invalid HTML and would make every click
//   on them navigate as well.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCard({
	application,
	onDelete,
}: ApplicationCardProps) {
	const title =
		applicationTitle(application.input) ?? m['dashboard.card.untitled']()

	return (
		<Panel className={styles.root} data-application-id={application.id}>
			<Link
				className={styles.link}
				params={{ applicationId: application.id }}
				to="/applications/$applicationId"
			>
				<span className="visually-hidden">
					{m['dashboard.card.open']({ title })}
				</span>
			</Link>
			<p className={styles.preview}>
				{application.letter.replace(/\n\s*\n/g, '\n')}
			</p>
			<div className={styles.actions}>
				<Button
					iconStart={<Trash2Icon />}
					onClick={() => onDelete(application)}
					variant="ghost"
				>
					{m['dashboard.card.delete']()}
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
