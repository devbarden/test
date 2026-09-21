import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { m } from '@/paraglide/messages'
import { Logo } from './logo'
import styles from './logo.module.css'

type HomeLinkProps = {
	className?: string
	tone?: 'default' | 'inverse'
}

export function HomeLink({ className, tone }: HomeLinkProps) {
	return (
		<Link
			aria-label={m['common.home']()}
			className={clsx(styles.homeLink, className)}
			to="/"
		>
			<Logo tone={tone} />
		</Link>
	)
}
