import { describe, expect, it } from 'vitest'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import { letterContent, letterNotice } from './letter-view'

const saved = { id: 'a', letter: 'Saved letter' } as ApplicationDto

describe('letterContent', () => {
	it('shows the placeholder, then the saved letter, when idle', () => {
		expect(letterContent({ status: 'idle' }, undefined)).toEqual({
			kind: 'placeholder',
		})
		expect(letterContent({ status: 'idle' }, saved)).toEqual({
			kind: 'letter',
			text: 'Saved letter',
		})
	})

	it('streams, then holds the text while it is saved', () => {
		expect(letterContent({ status: 'streaming', text: 'Dear' }, saved)).toEqual(
			{ kind: 'streaming', text: 'Dear' },
		)
		expect(letterContent({ status: 'saving', text: 'Dear' }, saved)).toEqual({
			kind: 'saving',
			text: 'Dear',
		})
	})

	it('keeps the saved letter over a stopped or failed retry', () => {
		expect(letterContent({ status: 'stopped', text: 'Par' }, saved)).toEqual({
			kind: 'letter',
			text: 'Saved letter',
		})
		expect(
			letterContent(
				{ error: { code: 'interrupted' }, status: 'failed', text: 'Par' },
				saved,
			),
		).toEqual({ kind: 'letter', text: 'Saved letter' })
	})

	it('shows partial text only when there is nothing saved', () => {
		expect(
			letterContent({ status: 'stopped', text: 'Partial' }, undefined),
		).toEqual({ kind: 'letter', text: 'Partial' })
		expect(letterContent({ status: 'stopped', text: '  ' }, undefined)).toEqual(
			{ kind: 'placeholder' },
		)
	})

	it('shows a whole letter that could not be saved, even over a saved one', () => {
		expect(
			letterContent(
				{ error: { code: 'save_failed' }, status: 'failed', text: 'Whole' },
				saved,
			),
		).toEqual({ kind: 'letter', text: 'Whole' })
	})
})

describe('letterNotice', () => {
	it('explains a failure and a stop, and says nothing otherwise', () => {
		expect(
			letterNotice(
				{ error: { code: 'network' }, status: 'failed', text: '' },
				undefined,
			),
		).toEqual({ error: { code: 'network' }, kind: 'failed' })
		expect(letterNotice({ status: 'stopped', text: '' }, saved)).toEqual({
			kind: 'stopped',
			savedLetterKept: true,
		})
		expect(letterNotice({ status: 'idle' }, saved)).toBeUndefined()
	})
})
