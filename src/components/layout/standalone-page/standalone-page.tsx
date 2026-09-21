import type { ReactNode } from 'react'
import { Container } from '../container'

// ═══════════════════════════════════════════════════════════════════════════
//   For a page that has no shell around it — a 404 or a crash outside the
//   app — so it still has the gutter and the <main> landmark every other
//   page has.
// ═══════════════════════════════════════════════════════════════════════════
export function StandalonePage({ children }: { children: ReactNode }) {
	return (
		<Container>
			<main>{children}</main>
		</Container>
	)
}
