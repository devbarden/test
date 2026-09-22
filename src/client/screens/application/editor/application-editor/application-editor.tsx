import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { GoalBanner } from '@/client/features/applications/ui/goal-banner'
import { PageHeader } from '@/client/kit/page-header'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { applicationTitle } from '@/domain/applications/application-title'
import { LetterPanel } from '../../letter/letter-panel'
import { letterContent, letterNotice } from '../../letter/letter-view'
import { ApplicationForm, useApplicationForm } from '../application-form'
import styles from './application-editor.module.css'
import { scrollIntoViewIfStacked } from './scroll-into-view-if-stacked'
import { useGenerateApplication } from './use-generate-application'
import { useLeaveGuard } from './use-leave-guard'

type ApplicationEditorProps = {
	justSaved?: boolean
	saved?: ApplicationDto
	onSaved?: (application: ApplicationDto) => Promise<void> | void
}

// ═══════════════════════════════════════════════════════════════════════════
//   After the first save the route changes and the editor remounts; focus
//   moves to the letter so a keyboard user is not left on a vanished button.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationEditor({ justSaved = false, onSaved, saved }: ApplicationEditorProps) {
	const panelRef = useRef<HTMLElement>(null)
	const generation = useGenerateApplication(saved, {
		onStart: () => scrollIntoViewIfStacked(panelRef.current),
	})

	useEffect(() => {
		if (justSaved) panelRef.current?.focus({ preventScroll: true })
	}, [justSaved])

	useLeaveGuard(generation.isGenerating)

	// ═════════════════════════════════════════════════════════════════════════
	//   Awaits the move to the saved letter's page, so the form stays
	//   submitting and a second Generate cannot create a duplicate meanwhile.
	// ═════════════════════════════════════════════════════════════════════════
	const form = useApplicationForm(saved, async (input) => {
		const application = await generation.generate(input)

		if (application) await onSaved?.(application)
	})
	const title = useStore(form.store, (state) => applicationTitle(state.values))

	return (
		<div className={styles.root}>
			<div className={styles.workspace}>
				<div className={styles.formColumn}>
					<PageHeader size="md" title={title ?? 'New application'} tone={title ? 'default' : 'muted'} />
					<ApplicationForm form={form} hasLetter={Boolean(saved)} isGenerating={generation.isGenerating} />
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
