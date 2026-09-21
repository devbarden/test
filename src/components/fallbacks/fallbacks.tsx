import type { ErrorComponentProps } from '@tanstack/react-router'
import { Container } from '@/components/layout/page'
import { StatusPage } from '@/components/layout/status-page'
import { Button, ButtonLink } from '@/components/ui/button'

export function NotFound() {
	return (
		<Container>
			<StatusPage
				action={
					<ButtonLink to="/" variant="secondary">
						Back to applications
					</ButtonLink>
				}
				description="The page you are looking for does not exist or was moved."
				title="Page not found"
			/>
		</Container>
	)
}

export function RouteError({ error, reset }: ErrorComponentProps) {
	console.error(error)

	return (
		<Container>
			<StatusPage
				action={
					<Button onClick={reset} variant="secondary">
						Try again
					</Button>
				}
				description="Something went wrong on our side. Your letters are safe in this browser."
				title="Something went wrong"
			/>
		</Container>
	)
}
