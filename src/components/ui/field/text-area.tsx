import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './field.module.css'
import { useFieldControlProps } from './field-context'

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
	const controlProps = useFieldControlProps()

	return (
		<textarea
			{...props}
			{...controlProps}
			className={clsx(styles.control, styles.textArea, className)}
		/>
	)
}
