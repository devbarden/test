import { BRAND_NAME } from '@/lib/document/brand'
import styles from './logo.module.css'
import { MARK_PATHS, WORDMARK_PATHS, WORDMARK_TRANSFORM } from './logo-paths'

type LogoTone = 'default' | 'inverse'

const WORDMARK_CLASS = {
	default: styles.wordmark,
	inverse: styles.wordmarkInverse,
} satisfies Record<LogoTone, string | undefined>

type LogoProps = {
	tone?: LogoTone
}

export function Logo({ tone = 'default' }: LogoProps) {
	return (
		<span className={styles.root}>
			<svg aria-hidden="true" className={styles.lockup} viewBox="0 0 179 48">
				<g className={styles.mark} transform="translate(0 2)">
					{MARK_PATHS.map(({ d, x, y }) => (
						<path d={d} key={d} transform={`translate(${x} ${y})`} />
					))}
				</g>
				<g className={WORDMARK_CLASS[tone]} transform={WORDMARK_TRANSFORM}>
					{WORDMARK_PATHS.map((d) => (
						<path d={d} key={d} />
					))}
				</g>
			</svg>
			<span className="visually-hidden">{BRAND_NAME}</span>
		</span>
	)
}
