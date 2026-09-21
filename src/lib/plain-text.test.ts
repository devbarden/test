import { describe, expect, it } from 'vitest'
import { applicationInputSchema } from '@/features/applications/model/application.schema'
import { toPlainText } from './plain-text'

describe('toPlainText', () => {
	it('drops control characters and keeps tabs and line breaks', () => {
		expect(toPlainText('Dear\u0000 Apple\u0007\r\n\tTeam\u007F')).toBe(
			'Dear Apple\r\n\tTeam',
		)
	})

	it('keeps non-latin text and emoji intact', () => {
		expect(toPlainText('Привет 👋 你好')).toBe('Привет 👋 你好')
	})

	it('is applied by the input schema before anything else sees the text', () => {
		const input = applicationInputSchema.parse({
			company: 'Apple\u0000',
			details: '',
			jobTitle: 'PM',
			skills: 'HTML',
		})

		expect(input.company).toBe('Apple')
	})
})
