import { useRouterState } from '@tanstack/react-router'

export function usePathname(): string {
	return useRouterState({ select: (state) => state.location.pathname })
}
