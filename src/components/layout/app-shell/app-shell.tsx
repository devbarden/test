import type { ReactNode } from 'react'
import { AppHeader } from '../app-header'
import { Container } from '../container'
import styles from './app-shell.module.css'

type AppShellProps = {
	account?: ReactNode
	children?: ReactNode
	status?: ReactNode
}

export function AppShell({ account, children, status }: AppShellProps) {
	return (
		<Container>
			<AppHeader account={account} status={status} />
			<main className={styles.root} tabIndex={-1}>
				{children}
			</main>
		</Container>
	)
}
