import clsx from 'clsx'
import styles from './icon-button.module.css'

export function iconButtonClassName(className?: string) {
	return clsx(styles.iconButton, className)
}
