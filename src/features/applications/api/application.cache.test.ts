import { type InfiniteData, QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type {
	ApplicationDto,
	ApplicationPage,
} from '../model/application.schema'
import {
	applicationFromList,
	insertApplication,
	replaceApplication,
} from './application.cache'
import { applicationKeys } from './application.queries'

// ═══════════════════════════════════════════════════════════════════════════
//   The keys module also builds the query functions, which import the
//   server functions and with them the server config. The cache never
//   calls them.
// ═══════════════════════════════════════════════════════════════════════════
vi.mock('./application.api', () => ({}))

function letter(id: string, company: string): ApplicationDto {
	return {
		createdAt: '2026-09-21T00:00:00.000Z',
		id,
		input: {
			company,
			details: '',
			jobTitle: 'PM',
			skills: 'HTML',
			tone: 'professional',
		},
		letter: `Dear ${company}`,
		updatedAt: '2026-09-21T00:00:00.000Z',
	}
}

function seed(
	queryClient: QueryClient,
	search: string,
	items: ApplicationDto[],
) {
	queryClient.setQueryData<InfiniteData<ApplicationPage, string | undefined>>(
		applicationKeys.list(search),
		{ pageParams: [undefined], pages: [{ items, nextCursor: null }] },
	)
}

function ids(queryClient: QueryClient, search: string) {
	return queryClient
		.getQueryData<InfiniteData<ApplicationPage>>(applicationKeys.list(search))
		?.pages.flatMap((page) => page.items.map((item) => item.id))
}

const APPLE = letter('01900000-0000-7000-8000-000000000001', 'Apple')
const GOOGLE = letter('01900000-0000-7000-8000-000000000002', 'Google')

describe('application cache across searches', () => {
	it('inserts a letter only into the lists whose search it matches', () => {
		const queryClient = new QueryClient()

		seed(queryClient, '', [APPLE])
		seed(queryClient, 'apple', [APPLE])
		insertApplication(queryClient, GOOGLE)

		expect(ids(queryClient, '')).toEqual([GOOGLE.id, APPLE.id])
		expect(ids(queryClient, 'apple')).toEqual([APPLE.id])
	})

	it('drops an edited letter from a search it no longer matches', () => {
		const queryClient = new QueryClient()

		seed(queryClient, '', [APPLE])
		seed(queryClient, 'apple', [APPLE])
		replaceApplication(queryClient, { ...APPLE, input: GOOGLE.input })

		expect(ids(queryClient, '')).toEqual([APPLE.id])
		expect(ids(queryClient, 'apple')).toEqual([])
	})

	it('finds a letter in whichever list holds it', () => {
		const queryClient = new QueryClient()

		seed(queryClient, 'google', [GOOGLE])

		expect(applicationFromList(queryClient, GOOGLE.id)?.data).toEqual(GOOGLE)
		expect(applicationFromList(queryClient, APPLE.id)).toBeUndefined()
	})
})
