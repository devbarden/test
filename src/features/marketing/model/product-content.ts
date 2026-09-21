import type { Locale } from '@/lib/i18n/locale'
import { m } from '@/paraglide/messages'

type Text = (options?: { locale?: Locale }) => string

type Entry<Id extends string> = { body: Text; id: Id; title: Text }

type Question = { answer: Text; id: string; question: Text }

export type ProductStepId = 'one' | 'two' | 'three'

export type ProductBenefitId = 'voice' | 'saved' | 'goal'

export const PRODUCT_STEPS: readonly Entry<ProductStepId>[] = [
	{
		body: (options) => m['landing.steps.one.body']({}, options),
		id: 'one',
		title: (options) => m['landing.steps.one.title']({}, options),
	},
	{
		body: (options) => m['landing.steps.two.body']({}, options),
		id: 'two',
		title: (options) => m['landing.steps.two.title']({}, options),
	},
	{
		body: (options) => m['landing.steps.three.body']({}, options),
		id: 'three',
		title: (options) => m['landing.steps.three.title']({}, options),
	},
]

export const PRODUCT_BENEFITS: readonly Entry<ProductBenefitId>[] = [
	{
		body: (options) => m['landing.features.voice.body']({}, options),
		id: 'voice',
		title: (options) => m['landing.features.voice.title']({}, options),
	},
	{
		body: (options) => m['landing.features.saved.body']({}, options),
		id: 'saved',
		title: (options) => m['landing.features.saved.title']({}, options),
	},
	{
		body: (options) => m['landing.features.goal.body']({}, options),
		id: 'goal',
		title: (options) => m['landing.features.goal.title']({}, options),
	},
]

export const PRODUCT_FAQ: readonly Question[] = [
	{
		answer: (options) => m['landing.faq.free.answer']({}, options),
		id: 'free',
		question: (options) => m['landing.faq.free.question']({}, options),
	},
	{
		answer: (options) => m['landing.faq.facts.answer']({}, options),
		id: 'facts',
		question: (options) => m['landing.faq.facts.question']({}, options),
	},
	{
		answer: (options) => m['landing.faq.language.answer']({}, options),
		id: 'language',
		question: (options) => m['landing.faq.language.question']({}, options),
	},
	{
		answer: (options) => m['landing.faq.privacy.answer']({}, options),
		id: 'privacy',
		question: (options) => m['landing.faq.privacy.question']({}, options),
	},
]
