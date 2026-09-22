import type { ReactNode } from 'react'
import { Container } from '@/client/kit/container'
import { AppHeader } from '../app-header'
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
