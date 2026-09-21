import type { ReactNode } from 'react'
import { Container } from '../container'

export function StandalonePage({ children }: { children: ReactNode }) {
	return (
		<Container>
			<main>{children}</main>
		</Container>
	)
}
