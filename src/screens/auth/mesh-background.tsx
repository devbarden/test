import styles from './mesh-background.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   Three soft blobs of the brand's greens drifting on long, out-of-phase
//   loops behind the form: enough life to make the page feel made, never
//   enough to pull the eye from the fields. CSS only — a motion library for
//   one background would cost the sign-in page more than it adds.
// ═══════════════════════════════════════════════════════════════════════════
export function MeshBackground() {
	return (
		<div aria-hidden="true" className={styles.root}>
			<span className={styles.blob} />
			<span className={styles.blob} />
			<span className={styles.blob} />
		</div>
	)
}
