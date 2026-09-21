import type { ReactNode } from 'react'
import { Container } from '../container'

type StandalonePageProps = {
	children: ReactNode
}

export function StandalonePage({ children }: StandalonePageProps) {
	return (
		<Container>
			<main>{children}</main>
		</Container>
	)
}
