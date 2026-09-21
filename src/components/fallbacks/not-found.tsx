import { StatusPage } from '@/components/layout/status-page'
import { ButtonLink } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

export function NotFound() {
	return (
		<StatusPage
			action={
				<ButtonLink to="/" variant="secondary">
					{m['fallbacks.notFound.action']()}
				</ButtonLink>
			}
			description={m['fallbacks.notFound.description']()}
			title={m['fallbacks.notFound.title']()}
		/>
	)
}
