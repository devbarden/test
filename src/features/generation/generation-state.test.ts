import { describe, expect, it } from 'vitest'
import {
	type GenerationAction,
	type GenerationState,
	generationReducer,
	IDLE_GENERATION,
} from './generation-state'

function run(actions: GenerationAction[]): GenerationState {
	return actions.reduce(generationReducer, IDLE_GENERATION)
}

describe('generationReducer', () => {
	it('waits for the first fragment, then accumulates text', () => {
		expect(run([{ type: 'start' }])).toEqual({ status: 'waiting' })
		expect(
			run([
				{ type: 'start' },
				{ text: 'Dear ', type: 'delta' },
				{ text: 'Apple', type: 'delta' },
			]),
		).toEqual({ status: 'streaming', text: 'Dear Apple' })
	})

	it('keeps the partial text when a generation fails or is stopped', () => {
		const partial: GenerationAction[] = [
			{ type: 'start' },
			{ text: 'Dear', type: 'delta' },
		]

		expect(
			run([...partial, { error: { code: 'interrupted' }, type: 'fail' }]),
		).toEqual({
			error: { code: 'interrupted' },
			status: 'failed',
			text: 'Dear',
		})
		expect(run([...partial, { type: 'stop' }])).toEqual({
			status: 'stopped',
			text: 'Dear',
		})
	})

	it('ignores stop when nothing is being generated', () => {
		expect(run([{ type: 'stop' }])).toBe(IDLE_GENERATION)
	})

	it('starts over from scratch on a new start', () => {
		expect(
			run([
				{ type: 'start' },
				{ text: 'Old', type: 'delta' },
				{ type: 'stop' },
				{ type: 'start' },
			]),
		).toEqual({ status: 'waiting' })
	})

	it('returns to idle on completion', () => {
		expect(
			run([
				{ type: 'start' },
				{ text: 'Hi', type: 'delta' },
				{ type: 'complete' },
			]),
		).toBe(IDLE_GENERATION)
	})
})
