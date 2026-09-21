import styles from './thinking-orb.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   The wait before the first word — about four seconds on the live API.
//   A breathing sphere rather than a spinner: the prototype's choice, and
//   it reads as "thinking", not as "loading a file". Decoration only: the
//   letter panel's live region already says the letter is being written.
// ═══════════════════════════════════════════════════════════════════════════
export function ThinkingOrb() {
	return (
		<div aria-hidden="true" className={styles.root}>
			<div className={styles.orb} />
		</div>
	)
}
