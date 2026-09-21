import clsx from 'clsx'
import styles from './step-progress.module.css'

type StepProgressProps = {
	className?: string
	label: string
	max: number
	value: number
	variant: 'dots' | 'bars'
}

export function StepProgress({
	className,
	label,
	max,
	value,
	variant,
}: StepProgressProps) {
	const steps = Array.from({ length: max }, (_, index) => ({
		isDone: index < value,
		step: index + 1,
	}))

	return (
		<div
			aria-label={label}
			aria-valuemax={max}
			aria-valuemin={0}
			aria-valuenow={Math.min(value, max)}
			className={clsx(styles.progress, styles[variant], className)}
			role="progressbar"
		>
			{steps.map(({ isDone, step }) => (
				<span className={clsx(styles.step, isDone && styles.done)} key={step} />
			))}
		</div>
	)
}
