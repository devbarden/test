import styles from './spinner.module.css'

const SPOKES = Array.from({ length: 8 }, (_, index) => index)

export function Spinner() {
	return (
		<svg aria-hidden="true" className={styles.root} fill="none" viewBox="0 0 24 24">
			{SPOKES.map((spoke) => (
				<line
					key={spoke}
					opacity={1 - spoke * 0.1}
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="2"
					transform={`rotate(${spoke * -45} 12 12)`}
					x1="12"
					x2="12"
					y1="2.5"
					y2="6.5"
				/>
			))}
		</svg>
	)
}
