import styles from './letter-panel.module.css'
import { LetterText } from './letter-text'
import type { LetterContent } from './letter-view'
import { ThinkingOrb } from './thinking-orb'

type LetterBodyProps = {
	content: LetterContent
}

export function LetterBody({ content }: LetterBodyProps) {
	switch (content.kind) {
		case 'placeholder':
			return (
				<p className={styles.placeholder}>
					Your personalized job application will appear here…
				</p>
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
