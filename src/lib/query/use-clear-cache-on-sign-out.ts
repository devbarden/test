import { useClerk } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { disposeUserQueryClient } from './user-query-client'

export function useClearCacheOnSignOut() {
	const clerk = useClerk()

	useEffect(
		() =>
			clerk.addListener(({ user }) => {
				if (user === null) disposeUserQueryClient()
			}),
		[clerk],
	)
}
