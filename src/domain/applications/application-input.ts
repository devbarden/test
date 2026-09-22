import type { ApplicationInput } from './application.schema'
import { DEFAULT_LETTER_TONE } from './application-tone'

export const INPUT_LIMITS = {
	company: 100,
	details: 1200,
	jobTitle: 100,
	skills: 300,
} as const

export const EMPTY_APPLICATION_INPUT: ApplicationInput = {
	company: '',
	details: '',
	jobTitle: '',
	skills: '',
	tone: DEFAULT_LETTER_TONE,
}
