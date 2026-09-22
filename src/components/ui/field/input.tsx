import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './field.module.css'
import { useFieldControlProps } from './field-context'

type InputProps = ComponentProps<'input'>

export function Input({ className, ...props }: InputProps) {
	const controlProps = useFieldControlProps()

	return <input {...props} {...controlProps} className={clsx(styles.control, styles.input, className)} />
}
