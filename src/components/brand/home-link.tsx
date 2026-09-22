import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { BRAND_NAME } from '@/lib/document/brand'
import { Logo, type LogoTone } from './logo'
import styles from './logo.module.css'

type HomeLinkProps = {
	className?: string
	tone?: LogoTone
}

export function HomeLink({ className, tone }: HomeLinkProps) {
	return (
		<Link aria-label={`${BRAND_NAME}, home page`} className={clsx(styles.homeLink, className)} to="/">
			<Logo tone={tone} />
		</Link>
	)
}
