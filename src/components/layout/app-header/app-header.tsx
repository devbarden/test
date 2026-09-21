import { HouseIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { HomeLink } from '@/components/brand'
import { IconButtonLink } from '@/components/ui/icon-button'
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
						label="All applications"
						to="/app/applications"
					/>
					{account && <div className={styles.account}>{account}</div>}
				</div>
			</div>
		</header>
	)
}
