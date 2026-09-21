import { SquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Spinner } from '@/components/ui/spinner'
import { m } from '@/paraglide/messages'
import styles from './letter-panel.module.css'
import type { LetterContent } from './letter-view'

type LetterFooterProps = {
	canStop: boolean
	content: LetterContent
	onStop: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   No Stop while saving: the server keeps the letter whatever the browser
//   does.
// ═══════════════════════════════════════════════════════════════════════════
export function LetterFooter({ canStop, content, onStop }: LetterFooterProps) {
	switch (content.kind) {
		case 'waiting':
			return null
		case 'streaming':
		case 'saving':
			return (
				<div className={styles.footer}>
					<span className={styles.progress}>
						<Spinner />
						{content.kind === 'saving'
							? m['editor.panel.saving']()
							: m['editor.panel.writing']()}
					</span>
					{canStop && (
						<Button iconEnd={<SquareIcon />} onClick={onStop} variant="ghost">
							{m['editor.panel.stop']()}
						</Button>
					)}
				</div>
			)
		case 'placeholder':
		case 'letter':
			return (
				<div className={styles.footer}>
					<CopyButton
						text={content.kind === 'letter' ? content.text : undefined}
					/>
				</div>
			)
	}
}
