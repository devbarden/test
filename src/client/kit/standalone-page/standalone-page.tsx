import type { ReactNode } from 'react'
import { Container } from '@/client/kit/container'

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
