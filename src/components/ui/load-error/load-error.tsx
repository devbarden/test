import { Alert } from '../alert'
import { Button } from '../button'
import styles from './load-error.module.css'

type LoadErrorProps = {
	children: string
	onRetry: () => void
}

export function LoadError({ children, onRetry }: LoadErrorProps) {
	return (
		<div className={styles.root}>
			<Alert tone="danger">{children}</Alert>
			<Button onClick={onRetry} variant="secondary">
				Try again
			</Button>
		</div>
	)
}
