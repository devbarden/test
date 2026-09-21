import { SquareIcon } from 'lucide-react'
import type { Ref } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Panel } from '@/components/ui/panel'
import { Spinner } from '@/components/ui/spinner'
import styles from './letter-panel.module.css'
import { LetterText } from './letter-text'
import { ThinkingOrb } from './thinking-orb'

export type LetterContent =
	| { kind: 'placeholder' }
	| { kind: 'waiting' }
	| { kind: 'streaming'; text: string }
	| { kind: 'letter'; text: string }

export type LetterNotice = {
	message: string
	tone: 'danger' | 'info'
}

type LetterPanelProps = {
	content: LetterContent
	notice?: LetterNotice
	onStop: () => void
	ref?: Ref<HTMLElement>
}

export function LetterPanel({
	content,
	notice,
	onStop,
	ref,
}: LetterPanelProps) {
	return (
		<Panel className={styles.panel}>
			<section aria-label="Cover letter" className={styles.section} ref={ref}>
				{notice && <Alert tone={notice.tone}>{notice.message}</Alert>}
				<LetterBody content={content} />
				<LetterFooter content={content} onStop={onStop} />
			</section>
		</Panel>
	)
}

function LetterBody({ content }: { content: LetterContent }) {
	switch (content.kind) {
		case 'placeholder':
			return (
				<p className={styles.placeholder}>
					Your personalized job application will appear here...
				</p>
			)
		case 'waiting':
			return <ThinkingOrb />
		case 'streaming':
			return <LetterText streaming text={content.text} />
		case 'letter':
			return <LetterText text={content.text} />
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   While text is arriving, Copy gives way to Stop: copying half a letter is
//   never what anybody wants, and stopping a letter that went off in the
//   wrong direction saves waiting for the rest of it.
// ═══════════════════════════════════════════════════════════════════════════
function LetterFooter({
	content,
	onStop,
}: {
	content: LetterContent
	onStop: () => void
}) {
	switch (content.kind) {
		case 'waiting':
			return null
		case 'streaming':
			return (
				<div className={styles.footer}>
					<span className={styles.progress}>
						<Spinner />
						Writing…
					</span>
					<Button iconEnd={<SquareIcon />} onClick={onStop} variant="ghost">
						Stop
					</Button>
				</div>
			)
		case 'placeholder':
			return (
				<div className={styles.footer}>
					<CopyButton disabled text="" />
				</div>
			)
		case 'letter':
			return (
				<div className={styles.footer}>
					<CopyButton text={content.text} />
				</div>
			)
	}
}
