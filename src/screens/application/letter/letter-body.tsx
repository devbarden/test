import { m } from '@/paraglide/messages'
import styles from './letter-panel.module.css'
import { LetterText } from './letter-text'
import type { LetterContent } from './letter-view'
import { ThinkingOrb } from './thinking-orb'

export function LetterBody({ content }: { content: LetterContent }) {
	switch (content.kind) {
		case 'placeholder':
			return (
				<p className={styles.placeholder}>{m['editor.panel.placeholder']()}</p>
			)
		case 'waiting':
			return <ThinkingOrb />
		case 'streaming':
			return <LetterText streaming text={content.text} />
		case 'saving':
		case 'letter':
			return <LetterText text={content.text} />
	}
}
