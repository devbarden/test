import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './field.module.css'
import { useFieldControlProps } from './field-context'

export function Input({ className, ...props }: ComponentProps<'input'>) {
	const controlProps = useFieldControlProps()

	return (
		<input
			{...controlProps}
			{...props}
			className={clsx(styles.control, styles.input, className)}
		/>
	)
}
