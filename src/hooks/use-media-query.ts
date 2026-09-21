import { useSyncExternalStore } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
//   For the rare difference CSS cannot make — a different string, not a
//   different style. The server has no viewport and answers false, so use
//   it only where the first paint is on the client or the difference is
//   harmless for a frame.
// ═══════════════════════════════════════════════════════════════════════════
export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(onChange) => {
			const media = window.matchMedia(query)

			media.addEventListener('change', onChange)

			return () => media.removeEventListener('change', onChange)
		},
		() => window.matchMedia(query).matches,
		() => false,
	)
}
