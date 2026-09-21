import { m } from '@/paraglide/messages'
import { Alert } from '../alert'
import { Button } from '../button'
import styles from './load-error.module.css'

type LoadErrorProps = {
	children: string
	onRetry: () => void
}

export function LoadError({ children, onRetry }: LoadErrorProps) {
	return (
		<div className={styles.loadError}>
			<Alert tone="danger">{children}</Alert>
			<Button onClick={onRetry} variant="secondary">
				{m['common.tryAgain']()}
			</Button>
		</div>
	)
}
