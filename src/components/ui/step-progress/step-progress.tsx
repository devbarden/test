import clsx from 'clsx'
import styles from './step-progress.module.css'

type StepProgressVariant = 'dots' | 'bars'

type StepProgressProps = {
	className?: string
	label: string
	max: number
	value: number
	variant: StepProgressVariant
}

const VARIANT_CLASS = {
	bars: styles.bars,
	dots: styles.dots,
} satisfies Record<StepProgressVariant, string | undefined>

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
			className={clsx(styles.root, VARIANT_CLASS[variant], className)}
			role="progressbar"
		>
			{steps.map(({ isDone, step }) => (
				<span className={clsx(styles.step, isDone && styles.done)} key={step} />
			))}
		</div>
	)
}
