import { StatusPage } from '@/components/layout/status-page'
import { ButtonLink } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

// ═══════════════════════════════════════════════════════════════════════════
//   Only the content: inside the app it renders in the shell's <main>, and
//   the root route wraps it in a StandalonePage for an unknown public URL.
// ═══════════════════════════════════════════════════════════════════════════
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
