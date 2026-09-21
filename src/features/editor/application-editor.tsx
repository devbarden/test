import { useBlocker } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page'
import {
	type Application,
	type ApplicationInput,
	applicationTitle,
	EMPTY_APPLICATION_INPUT,
	useApplication,
	useApplicationStore,
} from '@/features/applications'
import {
	type GenerationState,
	generationErrorMessage,
	useLetterGeneration,
} from '@/features/generation'
import { GoalBanner } from '@/features/goal'
import styles from './application-editor.module.css'
import { ApplicationForm } from './application-form'
import {
	type LetterContent,
	type LetterNotice,
	LetterPanel,
} from './letter-panel'
import { scrollIntoViewIfStacked } from './scroll-into-view-if-stacked'

type ApplicationEditorProps = {
	application?: Application
	onSaved?: (applicationId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   One editor for both "new" and "existing". The id is fixed on mount — a
//   fresh one for a new application — so every generation from this screen,
//   "Try Again" included, writes to the same record instead of adding a
//   letter per click. What the form holds is a draft: it is saved together
//   with the letter it produced, never on its own, so the stored inputs
//   always describe the stored letter.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationEditor({
	application,
	onSaved,
}: ApplicationEditorProps) {
	const [applicationId] = useState(() => application?.id ?? crypto.randomUUID())
	const [input, setInput] = useState<ApplicationInput>(
		() => application?.input ?? EMPTY_APPLICATION_INPUT,
	)
	const saved = useApplication(applicationId)
	const store = useApplicationStore()
	const generation = useLetterGeneration()
	const panelRef = useRef<HTMLElement>(null)

	useBlocker({
		disabled: !generation.isGenerating,
		enableBeforeUnload: () => generation.isGenerating,
		shouldBlockFn: () =>
			!window.confirm(
				'Your letter is still being written. Leave and discard it?',
			),
	})

	const handleSubmit = async (validInput: ApplicationInput) => {
		scrollIntoViewIfStacked(panelRef.current)

		const outcome = await generation.generate(validInput, {
			onComplete: (letter) => {
				const now = Date.now()

				store.save({
					createdAt: saved?.createdAt ?? now,
					id: applicationId,
					input: validInput,
					letter,
					updatedAt: now,
				})
			},
		})

		if (outcome === 'completed') onSaved?.(applicationId)
	}

	const title = applicationTitle(input)

	return (
		<div className={styles.editor}>
			<div className={styles.workspace}>
				<div className={styles.formColumn}>
					<PageHeader
						placeholder={!title}
						size="md"
						title={title ?? 'New application'}
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
					content={letterContent(generation.state, saved)}
					notice={letterNotice(generation.state, saved)}
					onStop={generation.stop}
					ref={panelRef}
				/>
			</div>
			{saved && <GoalBanner />}
		</div>
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   A saved letter always wins over a broken one: if "Try Again" fails or is
//   stopped, the previous complete letter stays on screen. Partial text is
//   shown only when there is nothing better, so the user can still read
//   (or copy) what arrived. The one exception is a letter that arrived
//   whole but could not be saved: it is the only copy, so it is shown.
// ═══════════════════════════════════════════════════════════════════════════
function letterContent(
	state: GenerationState,
	saved: Application | undefined,
): LetterContent {
	switch (state.status) {
		case 'waiting':
			return { kind: 'waiting' }
		case 'streaming':
			return { kind: 'streaming', text: state.text }
		case 'failed':
			if (state.error.code === 'not_saved') {
				return { kind: 'letter', text: state.text }
			}
			if (saved) return { kind: 'letter', text: saved.letter }
			return state.text.trim()
				? { kind: 'letter', text: state.text }
				: { kind: 'placeholder' }
		case 'stopped':
			if (saved) return { kind: 'letter', text: saved.letter }
			return state.text.trim()
				? { kind: 'letter', text: state.text }
				: { kind: 'placeholder' }
		case 'idle':
			return saved
				? { kind: 'letter', text: saved.letter }
				: { kind: 'placeholder' }
	}
}

function letterNotice(
	state: GenerationState,
	saved: Application | undefined,
): LetterNotice | undefined {
	if (state.status === 'failed') {
		return { message: generationErrorMessage(state.error), tone: 'danger' }
	}

	if (state.status === 'stopped') {
		return {
			message: saved
				? 'Stopped. Your previous letter is unchanged.'
				: 'Stopped before the letter was finished, so it was not saved.',
			tone: 'info',
		}
	}

	return undefined
}
