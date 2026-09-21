import type { ReactNode } from 'react'
import { AppHeader } from '../app-header'
import { Container } from '../container'
import styles from './app-shell.module.css'

type AppShellProps = {
	account?: ReactNode
	children?: ReactNode
	status?: ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
//   The workspace frame: header and one <main>. It renders identically with
//   empty slots while Clerk loads, so the page never reflows when the
//   account menu and the goal counter arrive.
// ═══════════════════════════════════════════════════════════════════════════
export function AppShell({ account, children, status }: AppShellProps) {
	return (
		<Container>
			<AppHeader account={account} status={status} />
			<main className={styles.main} tabIndex={-1}>
				{children}
			</main>
		</Container>
	)
}
