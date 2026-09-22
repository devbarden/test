import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './field.module.css'
import { useFieldControlProps } from './field-context'

type TextAreaProps = ComponentProps<'textarea'>

export function TextArea({ className, ...props }: TextAreaProps) {
	const controlProps = useFieldControlProps()

	return <textarea {...props} {...controlProps} className={clsx(styles.control, styles.textArea, className)} />
}
