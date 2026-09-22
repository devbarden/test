import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './eyebrow.module.css'

type EyebrowProps = ComponentProps<'p'>

export function Eyebrow({ className, ...props }: EyebrowProps) {
	return <p {...props} className={clsx(styles.root, className)} />
}
