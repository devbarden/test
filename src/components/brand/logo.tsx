import { BRAND_NAME } from '@/lib/site'
import styles from './logo.module.css'
import { type LogoPath, MARK_PATHS, WORDMARK_PATHS } from './logo-paths'

// ═══════════════════════════════════════════════════════════════════════════
//   The full lockup from the mockup, 179×48. The wordmark is drawn, so the
//   name is also given as text for assistive tech and search.
// ═══════════════════════════════════════════════════════════════════════════
export function Logo({ tone = 'default' }: { tone?: 'default' | 'inverse' }) {
	return (
		<span className={styles.logo}>
			<svg aria-hidden="true" className={styles.lockup} viewBox="0 0 179 48">
				<g className={styles.markFill} transform="translate(0 2)">
					{renderPaths(MARK_PATHS)}
				</g>
				<g
					className={
						tone === 'inverse' ? styles.wordmarkInverse : styles.wordmarkFill
					}
				>
					{renderPaths(WORDMARK_PATHS)}
				</g>
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
