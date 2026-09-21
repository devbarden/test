import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './eyebrow.module.css'

export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
	return <p {...props} className={clsx(styles.root, className)} />
}
