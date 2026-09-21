import clsx from 'clsx'
import { useId } from 'react'
import styles from './logo.module.css'

const WAVE_ROWS = [5, 12, 19, 26, 33]

type LogoMarkProps = {
	className?: string
}

export function LogoMark({ className }: LogoMarkProps) {
	const id = useId()
	const clipId = `${id}-clip`
	const gradientId = `${id}-gradient`

	return (
		<svg
			aria-hidden="true"
			className={clsx(styles.mark, className)}
			fill="none"
			viewBox="0 0 40 40"
		>
			<defs>
				<clipPath id={clipId}>
					<circle cx="20" cy="20" r="20" />
				</clipPath>
				<linearGradient id={gradientId} x1="0" x2="40" y1="0" y2="40">
					<stop offset="0" stopColor="#6cc48b" />
					<stop offset="1" stopColor="#2f7a4a" />
				</linearGradient>
			</defs>
			<g clipPath={`url(#${clipId})`}>
				{WAVE_ROWS.map((y) => (
					<path
						d={`M-4 ${y} q5 -4 10 0 t10 0 t10 0 t10 0 t10 0`}
						key={y}
						stroke={`url(#${gradientId})`}
						strokeLinecap="round"
						strokeWidth="3.4"
					/>
				))}
			</g>
		</svg>
	)
}

export function Logo() {
	return (
		<span className={styles.logo}>
			<LogoMark />
			<span className={styles.wordmark}>Alt+Shift</span>
		</span>
	)
}
