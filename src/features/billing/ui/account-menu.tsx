import { UserButton } from '@clerk/tanstack-react-start'
import { WalletIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'
import styles from './account-menu.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk's account menu, with the plan added to it: the mockup's header has
//   no room for a billing control, and "Plan & billing" belongs with the
//   account anyway.
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
//   Clerk's trigger fills the header's framed slot and takes the icon
//   buttons' hover; the avatar shrinks to an icon's size inside the frame.
//   Clerk styles by value, so these are CSS values it passes through.
// ═══════════════════════════════════════════════════════════════════════════
const TRIGGER_APPEARANCE = {
	elements: {
		avatarBox: { height: '1.5rem', width: '1.5rem' },
		rootBox: { height: '100%', width: '100%' },
		userButtonBox: { height: '100%', justifyContent: 'center', width: '100%' },
		userButtonTrigger: {
			'&:focus': { boxShadow: 'none' },
			'&:hover': { backgroundColor: 'var(--color-control-hover)' },
			borderRadius: 'calc(var(--radius-md) - 1px)',
			height: '100%',
			justifyContent: 'center',
			transition: 'background-color var(--duration-fast) var(--ease-out)',
			width: '100%',
		},
	},
}

export function AccountMenu() {
	return (
		<UserButton appearance={TRIGGER_APPEARANCE}>
			<UserButton.MenuItems>
				<UserButton.Link
					href="/app/billing"
					label={m['billing.title']()}
					labelIcon={<WalletIcon className={styles.itemIcon} />}
				/>
			</UserButton.MenuItems>
		</UserButton>
	)
}
