import { CopyButton } from '@/client/kit/copy-button'
import { Spinner } from '@/client/kit/spinner'
import type { LetterContent } from '../letter-view'
import { StopButton } from '../stop-button'
import styles from './letter-footer.module.css'

type LetterFooterProps = {
	canStop: boolean
	content: LetterContent
	onStop: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   No Stop while waiting: there is nothing to keep yet, and a button under
//   the thinking animation reads as "something is stuck". No Stop while
//   saving either: the server keeps the letter whatever the browser does.
// ═══════════════════════════════════════════════════════════════════════════
export function LetterFooter({ canStop, content, onStop }: LetterFooterProps) {
	switch (content.kind) {
		case 'waiting':
			return null
		case 'streaming':
		case 'saving':
			return (
				<div className={styles.root}>
					<span className={styles.progress}>
						<Spinner />
						{content.kind === 'saving' ? 'Saving…' : 'Writing…'}
					</span>
					{canStop && <StopButton onStop={onStop} />}
				</div>
			)
		case 'placeholder':
		case 'letter':
			return (
				<div className={styles.root}>
					<CopyButton text={content.kind === 'letter' ? content.text : undefined} />
				</div>
			)
	}
}
