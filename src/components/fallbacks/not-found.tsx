import { StatusPage } from '@/components/layout/status-page'
import { ButtonLink } from '@/components/ui/button'

export function NotFound() {
	return (
		<StatusPage
			action={
				<ButtonLink to="/" variant="secondary">
					Go to the home page
				</ButtonLink>
			}
			description="The page you are looking for does not exist or was moved."
			title="Page not found"
		/>
	)
}
