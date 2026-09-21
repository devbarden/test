import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { applicationTitle } from '@/domain/applications/application-title'
import { GoalBanner } from '@/features/applications/ui/goal-banner'
import { LetterPanel } from '../letter/letter-panel'
import { letterContent, letterNotice } from '../letter/letter-view'
import styles from './application-editor.module.css'
import { ApplicationForm } from './application-form'
import { scrollIntoViewIfStacked } from './scroll-into-view-if-stacked'
import { useApplicationForm } from './use-application-form'
import { useGenerateApplication } from './use-generate-application'
import { useLeaveGuard } from './use-leave-guard'

type ApplicationEditorProps = {
	justSaved?: boolean
	saved?: ApplicationDto
	onSaved?: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   After the first save the route changes and the editor remounts; focus
//   moves to the letter so a keyboard user is not left on a vanished button.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationEditor({
	justSaved = false,
	onSaved,
	saved,
}: ApplicationEditorProps) {
	const panelRef = useRef<HTMLElement>(null)
	const generation = useGenerateApplication(saved, {
		onStart: () => scrollIntoViewIfStacked(panelRef.current),
	})

	useEffect(() => {
		if (justSaved) panelRef.current?.focus({ preventScroll: true })
	}, [justSaved])

	useLeaveGuard(generation.isGenerating)

	const form = useApplicationForm(saved, async (input) => {
		const application = await generation.generate(input)

		if (application) onSaved?.(application)
	})
	const title = useStore(form.store, (state) => applicationTitle(state.values))

	return (
		<div className={styles.root}>
			<div className={styles.workspace}>
				<div className={styles.formColumn}>
					<PageHeader
						size="md"
						title={title ?? 'New application'}
						tone={title ? 'default' : 'muted'}
					/>
					<ApplicationForm
						form={form}
						hasLetter={Boolean(saved)}
						isGenerating={generation.isGenerating}
					/>
				</div>
				<LetterPanel
					canStop={generation.canStop}
					content={letterContent(generation.state, saved)}
					isFreshlyWritten={generation.lastOutcome === 'completed' || justSaved}
					notice={letterNotice(generation.state, saved)}
					onStop={generation.stop}
					ref={panelRef}
				/>
			</div>
			{saved && <GoalBanner />}
		</div>
	)
}
