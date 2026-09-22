import { splitByTerms } from '@/lib/text/split-by-terms'
import styles from './highlight.module.css'

type HighlightProps = {
	terms: readonly string[]
	text: string
}

export function Highlight({ terms, text }: HighlightProps) {
	return (
		<>
			{splitByTerms(text, terms).map((part) =>
				part.isMatch ? (
					<mark className={styles.root} key={part.start}>
						{part.text}
					</mark>
				) : (
					part.text
				),
			)}
		</>
	)
}
