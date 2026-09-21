import type { Ref } from 'react'
import { Panel } from '@/components/ui/panel'
import { m } from '@/paraglide/messages'
import { LetterBody } from './letter-body'
import { LetterFooter } from './letter-footer'
import { LetterNoticeAlert } from './letter-notice-alert'
import styles from './letter-panel.module.css'
import type { LetterContent, LetterNotice } from './letter-view'

type LetterPanelProps = {
	canStop: boolean
	content: LetterContent
	isFreshlyWritten: boolean
	notice?: LetterNotice
	onStop: () => void
	ref?: Ref<HTMLElement>
}

// ═══════════════════════════════════════════════════════════════════════════
//   One polite status region narrates the generation for a screen reader —
//   started, saving, ready — instead of the text itself, which would be
//   read word by word as it streams in.
// ═══════════════════════════════════════════════════════════════════════════
export function LetterPanel({
	canStop,
	content,
	isFreshlyWritten,
	notice,
	onStop,
	ref,
}: LetterPanelProps) {
	return (
		<Panel
			aria-label={m['editor.panel.label']()}
			as="section"
			className={styles.root}
			ref={ref}
			tabIndex={-1}
		>
			{notice && <LetterNoticeAlert notice={notice} />}
			<LetterBody content={content} />
			<LetterFooter canStop={canStop} content={content} onStop={onStop} />
			<span className="visually-hidden" role="status">
				{announcement(content, isFreshlyWritten)}
			</span>
		</Panel>
	)
}

function announcement(content: LetterContent, isFreshlyWritten: boolean) {
	switch (content.kind) {
		case 'waiting':
			return m['editor.panel.thinking']()
		case 'saving':
			return m['editor.panel.saving']()
		case 'letter':
			return isFreshlyWritten ? m['editor.panel.ready']() : ''
		case 'placeholder':
		case 'streaming':
			return ''
	}
}
