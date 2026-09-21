import { splitByTerms } from '@/lib/text-parts'
import styles from './highlight.module.css'

type HighlightProps = {
	terms: readonly string[]
	text: string
}

export function Highlight({ terms, text }: HighlightProps) {
	return (
		<>
			{splitByTerms(text, terms).map((part, index) =>
				part.isMatch ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: the parts of one text in order; nothing is reordered
					<mark className={styles.root} key={index}>
						{part.text}
					</mark>
				) : (
					part.text
				),
			)}
		</>
	)
}
