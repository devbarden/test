import type { ApplicationInput } from './application.schema'

export function applicationTitle({
	company,
	jobTitle,
}: Pick<ApplicationInput, 'company' | 'jobTitle'>): string | null {
	const parts = [jobTitle.trim(), company.trim()].filter(Boolean)

	return parts.length > 0 ? parts.join(', ') : null
}
