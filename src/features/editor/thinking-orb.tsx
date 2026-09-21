import styles from './thinking-orb.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   The wait before the first word — about four seconds on the live API.
//   A breathing sphere rather than a spinner: the prototype's choice, and
//   it reads as "thinking", not as "loading a file".
// ═══════════════════════════════════════════════════════════════════════════
export function ThinkingOrb() {
	return (
		<div className={styles.stage}>
			<div className={styles.orb} />
			<span className="visually-hidden">Writing your letter…</span>
		</div>
	)
}
