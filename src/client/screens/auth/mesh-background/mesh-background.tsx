import styles from './mesh-background.module.css'

export function MeshBackground() {
	return (
		<div aria-hidden="true" className={styles.root}>
			<span className={styles.blob} />
			<span className={styles.blob} />
			<span className={styles.blob} />
		</div>
	)
}
