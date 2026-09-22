import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { Logo, type LogoTone } from '@/client/components/logo'
import { BRAND_NAME } from '@/client/lib/document/brand'
import styles from './home-link.module.css'

type HomeLinkProps = {
	className?: string
	tone?: LogoTone
}

export function HomeLink({ className, tone }: HomeLinkProps) {
	return (
		<Link aria-label={`${BRAND_NAME}, home page`} className={clsx(styles.root, className)} to="/">
			<Logo tone={tone} />
		</Link>
	)
}
