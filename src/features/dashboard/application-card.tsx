import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Panel } from '@/components/ui/panel'
import { type Application, applicationTitle } from '@/features/applications'
import styles from './application-card.module.css'

type ApplicationCardProps = {
	application: Application
	onDelete: (application: Application) => void
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
	const title = applicationTitle(application.input) ?? 'Untitled application'

	return (
		<Panel className={styles.card}>
			<Link
				className={styles.link}
				params={{ applicationId: application.id }}
				to="/applications/$applicationId"
			>
				<span className="visually-hidden">{`Open ${title}`}</span>
			</Link>
			<p className={styles.preview}>{application.letter}</p>
			<div className={styles.actions}>
				<Button
					iconStart={<Trash2Icon />}
					onClick={() => onDelete(application)}
					variant="ghost"
				>
					Delete
				</Button>
				<CopyButton text={application.letter} />
			</div>
		</Panel>
	)
}
