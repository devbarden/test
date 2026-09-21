import { HouseIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { HomeLink } from '@/components/brand'
import { LanguageSwitcher } from '@/components/locale/language-switcher'
import { IconButtonLink } from '@/components/ui/icon-button'
import { m } from '@/paraglide/messages'
import styles from './app-header.module.css'

type AppHeaderProps = {
	account?: ReactNode
	status?: ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
//   Layout only. What sits in the header — goal progress, the account menu —
//   is passed in by the route that composes the shell, so this component
//   knows nothing about letters or auth and renders just as well in the
//   loading fallback, where neither exists yet. The brand leads to the
//   public home page from anywhere, as brands do; the house leads to the
//   list of applications.
// ═══════════════════════════════════════════════════════════════════════════
export function AppHeader({ account, status }: AppHeaderProps) {
	return (
		<header className={styles.header}>
			<HomeLink />
			<div className={styles.actions}>
				{status}
				<LanguageSwitcher compact />
				<IconButtonLink
					icon={<HouseIcon />}
					label={m['header.allApplications']()}
					to="/applications"
				/>
				{account && <div className={styles.account}>{account}</div>}
			</div>
		</header>
	)
}
