import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { Trash2Icon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button } from '@/client/kit/button'
import { CopyButton } from '@/client/kit/copy-button'
import { Highlight } from '@/client/kit/highlight'
import { Panel } from '@/client/kit/panel'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { applicationLabel } from '@/domain/applications/application-title'
import { collapseParagraphs } from '@/lib/text/paragraphs'
import styles from './application-card.module.css'

type ApplicationCardProps = {
	application: ApplicationDto
	entrance?: number
	highlight?: readonly string[]
	onDelete: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   Buttons sit above one stretched link: buttons inside an <a> are invalid
//   HTML.
//
//   `entrance` is the card's place in a freshly loaded page: the panel is
//   there at once where the skeleton stood, and its text and actions fade
//   in after `entrance` beats, so a page of ten reads as letters arriving
//   one by one, not as a block that switched on.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCard({ application, entrance, highlight = [], onDelete }: ApplicationCardProps) {
	const title = applicationLabel(application.input)
	const isArriving = entrance !== undefined

	return (
		<Panel
			className={clsx(styles.root, isArriving && styles.arriving)}
			data-application-id={application.id}
			style={isArriving ? entranceStyle(entrance) : undefined}
		>
			<Link className={styles.link} params={{ applicationId: application.id }} to="/app/applications/$applicationId">
				<span className="visually-hidden">{`Open ${title}`}</span>
			</Link>
			<p className={styles.preview}>
				<Highlight terms={highlight} text={collapseParagraphs(application.letter)} />
			</p>
			<div className={styles.actions}>
				<Button iconStart={<Trash2Icon />} onClick={() => onDelete(application)} variant="ghost">
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

function entranceStyle(entrance: number): CSSProperties {
	return { '--_entrance': entrance } as CSSProperties
}
