import type { ApplicationDto } from './application.schema'

export const APPLICATIONS_PAGE_SIZE = 10

export type ApplicationPage = {
	items: ApplicationDto[]
	nextCursor: string | null
}
