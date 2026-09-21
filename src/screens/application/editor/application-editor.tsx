import { useBlocker } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import {
	type ApplicationDto,
	type ApplicationInput,
	EMPTY_APPLICATION_INPUT,
} from '@/features/applications/model/application.schema'
import { applicationTitle } from '@/features/applications/model/application-title'
import { GoalBanner } from '@/features/applications/ui/goal-banner'
import { usePlanLimits } from '@/features/billing/hooks/use-plan-limits'
import { m } from '@/paraglide/messages'
import { LetterPanel } from '../letter/letter-panel'
import { letterContent, letterNotice } from '../letter/letter-view'
import styles from './application-editor.module.css'
import { ApplicationForm } from './application-form'
import { scrollIntoViewIfStacked } from './scroll-into-view-if-stacked'
import { useGenerateApplication } from './use-generate-application'

type ApplicationEditorProps = {
	justSaved?: boolean
	saved?: ApplicationDto
	onSaved?: (application: ApplicationDto) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   One editor for both "new" and "existing". A new application gets its id
//   from the server when its first letter is saved; from then on every
//   generation here, "Try Again" included, names that id and rewrites the
//   same record instead of adding a letter per click. What the form holds
//   is a draft: the server saves it together with the letter it produced,
//   never on its own, so the stored inputs always describe the stored
//   letter.
//
//   `justSaved` marks the hand-over from /new to the letter's own URL: that
//   is a different route, so the editor remounts, and without moving focus
//   to the letter the focused submit button would vanish from under a
//   keyboard user.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationEditor({
	justSaved = false,
	onSaved,
	saved,
}: ApplicationEditorProps) {
	const [input, setInput] = useState<ApplicationInput>(
		() => saved?.input ?? EMPTY_APPLICATION_INPUT,
	)
	const generation = useGenerateApplication(saved)
	const planLimits = usePlanLimits()
	const panelRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (justSaved) panelRef.current?.focus({ preventScroll: true })
	}, [justSaved])

	useBlocker({
		disabled: !generation.isGenerating,
		enableBeforeUnload: () => generation.isGenerating,
		shouldBlockFn: async () =>
			!(await ConfirmDialog.call({
				cancelLabel: m['editor.leaveDialog.stay'](),
				confirmLabel: m['editor.leaveDialog.leave'](),
				message: m['editor.leaveDialog.description'](),
				title: m['editor.leaveDialog.title'](),
				tone: 'danger',
			})),
	})

	const handleSubmit = async (validInput: ApplicationInput) => {
		const limit = planLimits.reached({ creates: !saved })

		if (limit) {
			planLimits.explain(limit)
			return
		}

		scrollIntoViewIfStacked(panelRef.current)

		const { application, error } = await generation.generate(validInput)

		if (error?.code === 'quota_exceeded') {
			planLimits.explain('daily', error.retryAfterSeconds)
		} else if (error?.code === 'application_limit_reached') {
			planLimits.explain('saved')
		}

		if (application) onSaved?.(application)
	}

	const title = applicationTitle(input)

	return (
		<div className={styles.root}>
			<div className={styles.workspace}>
				<div className={styles.formColumn}>
					<PageHeader
						size="md"
						title={title ?? m['editor.newApplication']()}
						tone={title ? 'default' : 'muted'}
					/>
					<ApplicationForm
						hasLetter={Boolean(saved)}
						isGenerating={generation.isGenerating}
						onChange={setInput}
						onSubmit={handleSubmit}
						value={input}
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
