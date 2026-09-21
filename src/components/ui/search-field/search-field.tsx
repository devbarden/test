import clsx from 'clsx'
import { SearchIcon, XIcon } from 'lucide-react'
import { type ComponentProps, useRef } from 'react'
import styles from './search-field.module.css'

type SearchFieldProps = Omit<
	ComponentProps<'input'>,
	'aria-label' | 'onChange' | 'type' | 'value'
> & {
	clearLabel: string
	label: string
	onValueChange: (value: string) => void
	value: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   A labelled search input with its own clear button. Escape clears it
//   too, and clearing keeps the focus in the field — the button that took
//   the click disappears with the text.
// ═══════════════════════════════════════════════════════════════════════════
export function SearchField({
	className,
	clearLabel,
	label,
	onValueChange,
	value,
	...props
}: SearchFieldProps) {
	const input = useRef<HTMLInputElement>(null)

	const clear = () => {
		onValueChange('')
		input.current?.focus()
	}

	return (
		<div className={clsx(styles.root, className)}>
			<SearchIcon aria-hidden="true" className={styles.icon} />
			<input
				{...props}
				aria-label={label}
				className={styles.input}
				onChange={(event) => onValueChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === 'Escape' && value) {
						event.preventDefault()
						clear()
					}
				}}
				ref={input}
				type="search"
				value={value}
			/>
			{value && (
				<button
					aria-label={clearLabel}
					className={styles.clear}
					onClick={clear}
					title={clearLabel}
					type="button"
				>
					<XIcon />
				</button>
			)}
		</div>
	)
}
