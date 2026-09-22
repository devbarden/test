import { SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Panel } from '@/components/ui/panel'
import styles from './no-matches.module.css'

type NoMatchesProps = {
	onClear: () => void
	search: string
}

export function NoMatches({ onClear, search }: NoMatchesProps) {
	return (
		<Panel className={styles.root} role="status">
			<SearchXIcon aria-hidden="true" className={styles.icon} />
			<Heading size="sm">Nothing found</Heading>
			<p className={styles.description}>{`No application matches “${search}”. Try a different word.`}</p>
			<Button onClick={onClear} variant="secondary">
				Clear search
			</Button>
		</Panel>
	)
}
