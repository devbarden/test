import { useEffect, useRef } from 'react'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import { cardLinkSelector } from './application-card'

type FocusRequest = {
	id: string | undefined
	isReady: (items: readonly ApplicationDto[]) => boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   Where keyboard focus goes when a card leaves or comes back. The focused
//   Delete button unmounts with its card, and focus would fall to <body>;
//   instead it moves to the neighbouring card, or to the page when the list
//   is empty, and Undo brings it to the restored card.
//
//   A request waits until the rendered list shows the change — the list is
//   deferred and animated, so the card is added or removed a moment after
//   the cache changes, not in the same render.
// ═══════════════════════════════════════════════════════════════════════════
export function useListFocus(items: readonly ApplicationDto[] | undefined) {
	const request = useRef<FocusRequest | null>(null)

	useEffect(() => {
		const pending = request.current

		if (!pending || !items || !pending.isReady(items)) return

		request.current = null

		const card = pending.id
			? document.querySelector<HTMLElement>(cardLinkSelector(pending.id))
			: null
		const target = card ?? document.querySelector<HTMLElement>('main')

		target?.focus()
	}, [items])

	return {
		afterRemoving(application: ApplicationDto) {
			const list = items ?? []
			const index = list.findIndex((item) => item.id === application.id)
			const neighbour = list[index + 1] ?? list[index - 1]

			request.current = {
				id: neighbour?.id,
				isReady: (next) => !next.some((item) => item.id === application.id),
			}
		},
		afterRestoring(application: ApplicationDto) {
			request.current = {
				id: application.id,
				isReady: (next) => next.some((item) => item.id === application.id),
			}
		},
	}
}
