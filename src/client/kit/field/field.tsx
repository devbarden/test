import { type ReactNode, useId } from 'react'
import styles from './field.module.css'
import { FieldContext } from './field-context'

type FieldProps = {
	children: ReactNode
	description?: ReactNode
	invalid?: boolean
	label: string
}

export function Field({ children, description, invalid = false, label }: FieldProps) {
	const id = useId()
	const descriptionId = description ? `${id}-description` : undefined

	return (
		<FieldContext value={{ descriptionId, id, invalid }}>
			<div className={styles.root}>
				<label className={styles.label} htmlFor={id}>
					{label}
				</label>
				{children}
				{description && (
					<div className={styles.description} id={descriptionId}>
						{description}
					</div>
				)}
			</div>
		</FieldContext>
	)
}
