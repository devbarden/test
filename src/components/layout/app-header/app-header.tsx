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

export function AppHeader({ account, status }: AppHeaderProps) {
	return (
		<header className={styles.root}>
			<HomeLink />
			<div className={styles.actions}>
				{status}
				<div className={styles.controls}>
					<IconButtonLink
						icon={<HouseIcon />}
						label={m['header.allApplications']()}
						to="/app/applications"
					/>
					<LanguageSwitcher variant="icon" />
					{account && <div className={styles.account}>{account}</div>}
				</div>
			</div>
		</header>
	)
}
