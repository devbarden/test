import { UserButton } from '@clerk/tanstack-react-start'
import { SparklesIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk's account menu, with the plan added to it: the mockup's header has
//   no room for a billing control, and "Plan & billing" belongs with the
//   account anyway.
// ═══════════════════════════════════════════════════════════════════════════
export function AccountMenu() {
	return (
		<UserButton>
			<UserButton.MenuItems>
				<UserButton.Link
					href="/applications/billing"
					label={m['billing.title']()}
					labelIcon={<SparklesIcon size={16} />}
				/>
			</UserButton.MenuItems>
		</UserButton>
	)
}
