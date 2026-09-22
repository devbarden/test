import { LetterText } from '../letter-text'
import type { LetterContent } from '../letter-view'
import { ThinkingOrb } from '../thinking-orb'
import styles from './letter-body.module.css'

type LetterBodyProps = {
	content: LetterContent
	startAtEnd?: boolean
}

export function LetterBody({ content, startAtEnd }: LetterBodyProps) {
	switch (content.kind) {
		case 'placeholder':
			return <p className={styles.placeholder}>Your personalized job application will appear here…</p>
		case 'waiting':
			return <ThinkingOrb />
		case 'streaming':
			return <LetterText streaming text={content.text} />
		case 'saving':
		case 'letter':
			return <LetterText startAtEnd={startAtEnd} text={content.text} />
	}
}
