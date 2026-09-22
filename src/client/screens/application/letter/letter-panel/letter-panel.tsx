import type { Ref } from 'react'
import { Panel } from '@/client/kit/panel'
import { LetterBody } from '../letter-body'
import { LetterFooter } from '../letter-footer'
import { LetterNoticeAlert } from '../letter-notice-alert'
import type { LetterContent, LetterNotice } from '../letter-view'
import styles from './letter-panel.module.css'

type LetterPanelProps = {
	canStop: boolean
	content: LetterContent
	isFreshlyWritten: boolean
	notice?: LetterNotice
	onStop: () => void
	ref?: Ref<HTMLElement>
}

export function LetterPanel({ canStop, content, isFreshlyWritten, notice, onStop, ref }: LetterPanelProps) {
	return (
		<Panel aria-label="Cover letter" as="section" className={styles.root} ref={ref} tabIndex={-1}>
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
			return 'Writing your letter…'
		case 'saving':
			return 'Saving…'
		case 'letter':
			return isFreshlyWritten ? 'Your letter is ready' : ''
		case 'placeholder':
		case 'streaming':
			return ''
	}
}
