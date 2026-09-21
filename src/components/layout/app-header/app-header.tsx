import { Link } from '@tanstack/react-router'
import { HouseIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand'
import { IconButtonLink } from '@/components/ui/icon-button'
import styles from './app-header.module.css'

type AppHeaderProps = {
	account?: ReactNode
	status?: ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
//   Layout only. What sits in the header — goal progress, the account menu —
//   is passed in by the route that composes the shell, so this component
//   knows nothing about letters or auth and renders just as well in the
//   loading fallback, where neither exists yet.
// ═══════════════════════════════════════════════════════════════════════════
export function AppHeader({ account, status }: AppHeaderProps) {
	return (
		<header className={styles.header}>
			<Link
				aria-label="Alt+Shift, all applications"
				className={styles.brand}
				to="/"
			>
				<Logo />
			</Link>
			<div className={styles.actions}>
				{status}
				<IconButtonLink icon={<HouseIcon />} label="All applications" to="/" />
				{account && <div className={styles.account}>{account}</div>}
			</div>
		</header>
	)
}
