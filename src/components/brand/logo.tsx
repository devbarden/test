import { BRAND_NAME } from '@/lib/site'
import styles from './logo.module.css'
import { type LogoPath, MARK_PATHS, WORDMARK_PATHS } from './logo-paths'

type LogoTone = 'default' | 'inverse'

const WORDMARK_CLASS = {
	default: styles.wordmark,
	inverse: styles.wordmarkInverse,
} satisfies Record<LogoTone, string | undefined>

export function Logo({ tone = 'default' }: { tone?: LogoTone }) {
	return (
		<span className={styles.root}>
			<svg aria-hidden="true" className={styles.lockup} viewBox="0 0 179 48">
				<g className={styles.mark} transform="translate(0 2)">
					{renderPaths(MARK_PATHS)}
				</g>
				<g className={WORDMARK_CLASS[tone]}>{renderPaths(WORDMARK_PATHS)}</g>
			</svg>
			<span className="visually-hidden">{BRAND_NAME}</span>
		</span>
	)
}

function renderPaths(paths: readonly LogoPath[]) {
	return paths.map((path) => (
		<path
			d={path.d}
			fillRule={path.evenOdd ? 'evenodd' : undefined}
			key={`${path.x},${path.y},${path.d.length}`}
			transform={`translate(${path.x} ${path.y})`}
		/>
	))
}
