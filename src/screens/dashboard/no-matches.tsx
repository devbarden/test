import { SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Panel } from '@/components/ui/panel'
import { m } from '@/paraglide/messages'
import styles from './no-matches.module.css'

type NoMatchesProps = {
	onClear: () => void
	search: string
}

export function NoMatches({ onClear, search }: NoMatchesProps) {
	return (
		<Panel className={styles.root} role="status">
			<SearchXIcon aria-hidden="true" className={styles.icon} />
			<Heading size="sm">{m['dashboard.search.empty.title']()}</Heading>
			<p className={styles.description}>
				{m['dashboard.search.empty.description']({ query: search })}
			</p>
			<Button onClick={onClear} variant="secondary">
				{m['dashboard.search.clear']()}
			</Button>
		</Panel>
	)
}
