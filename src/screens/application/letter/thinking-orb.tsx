import styles from './thinking-orb.module.css'

export function ThinkingOrb() {
	return (
		<div aria-hidden="true" className={styles.root}>
			<div className={styles.orb} />
		</div>
	)
}
