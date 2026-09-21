import { useQueryClient } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page'
import {
	type ApplicationDto,
	type ApplicationInput,
	applicationKeys,
	applicationTitle,
	EMPTY_APPLICATION_INPUT,
	putApplicationInCache,
} from '@/features/applications'
import {
	type GenerationState,
	useLetterGeneration,
} from '@/features/generation'
import { GoalBanner } from '@/features/goal'
import { apiErrorMessage } from '@/lib/api-error-message'
import styles from './application-editor.module.css'
import { ApplicationForm } from './application-form'
import {
	type LetterContent,
	type LetterNotice,
	LetterPanel,
} from './letter-panel'
import { scrollIntoViewIfStacked } from './scroll-into-view-if-stacked'

type ApplicationEditorProps = {
	application?: ApplicationDto
	onSaved?: (applicationId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   One editor for both "new" and "existing". A new application gets its id
//   from the server when its first letter is saved; from then on every
//   generation here, "Try Again" included, names that id and rewrites the
//   same record instead of adding a letter per click. What the form holds
//   is a draft: the server saves it together with the letter it produced,
//   never on its own, so the stored inputs always describe the stored
//   letter.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationEditor({
	application: saved,
	onSaved,
}: ApplicationEditorProps) {
	const [input, setInput] = useState<ApplicationInput>(
		() => saved?.input ?? EMPTY_APPLICATION_INPUT,
	)
	const queryClient = useQueryClient()
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

		let savedId: string | undefined

		const outcome = await generation.generate(
			{ applicationId: saved?.id, input: validInput },
			{
				onComplete: (application) => {
					savedId = application.id
					putApplicationInCache(queryClient, application, { isNew: !saved })
					void queryClient.invalidateQueries({
						queryKey: applicationKeys.all,
					})
				},
			},
		)

		if (outcome === 'completed' && savedId) onSaved?.(savedId)
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
	saved: ApplicationDto | undefined,
): LetterContent {
	switch (state.status) {
		case 'waiting':
			return { kind: 'waiting' }
		case 'streaming':
			return { kind: 'streaming', text: state.text }
		case 'failed':
			if (state.error.code === 'save_failed') {
				return { kind: 'letter', text: state.text }
			}
			return savedOrPartial(saved, state.text)
		case 'stopped':
			return savedOrPartial(saved, state.text)
		case 'idle':
			return saved
				? { kind: 'letter', text: saved.letter }
				: { kind: 'placeholder' }
	}
}

function savedOrPartial(
	saved: ApplicationDto | undefined,
	partial: string,
): LetterContent {
	if (saved) return { kind: 'letter', text: saved.letter }

	return partial.trim()
		? { kind: 'letter', text: partial }
		: { kind: 'placeholder' }
}

function letterNotice(
	state: GenerationState,
	saved: ApplicationDto | undefined,
): LetterNotice | undefined {
	if (state.status === 'failed') {
		return { message: apiErrorMessage(state.error), tone: 'danger' }
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
