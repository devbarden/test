type Entry<Id extends string> = { body: string; id: Id; title: string }

type Question = { answer: string; id: string; question: string }

export type ProductStepId = 'one' | 'two' | 'three'

export type ProductBenefitId = 'voice' | 'saved' | 'goal'

export const PRODUCT_STEPS: readonly Entry<ProductStepId>[] = [
	{
		body: 'The job title, the company and the strengths you want to lead with. Anything else that matters goes in one free-form box.',
		id: 'one',
		title: 'Describe the role',
	},
	{
		body: 'The letter appears word by word, built only from what you told it — no invented degrees, employers or numbers.',
		id: 'two',
		title: 'Watch it write',
	},
	{
		body: 'One click copies it. Every letter is saved, so you can come back, adjust the details and write another version.',
		id: 'three',
		title: 'Copy and send',
	},
]

export const PRODUCT_BENEFITS: readonly Entry<ProductBenefitId>[] = [
	{
		body: 'First person, from your own facts, in the language you write the details in.',
		id: 'voice',
		title: 'Sounds like you',
	},
	{
		body: 'Your applications live in one place, tied to your account on every device.',
		id: 'saved',
		title: 'Every letter kept',
	},
	{
		body: 'Five applications is the target. Your progress stays in view until you reach it.',
		id: 'goal',
		title: 'A goal that keeps you going',
	},
]

export const PRODUCT_FAQ: readonly Question[] = [
	{
		answer:
			'Yes. The Free plan lets you write letters every day at no cost. Pro raises the daily limit and the number of saved applications when you need more.',
		id: 'free',
		question: 'Is Alt+Shift free?',
	},
	{
		answer:
			'No. It uses only the facts you give it — no invented employers, years of experience, degrees or achievements.',
		id: 'facts',
		question: 'Will the letter make things up?',
	},
	{
		answer:
			'The letter follows the language you use for the details: describe a job in Russian and the letter is in Russian.',
		id: 'language',
		question: 'Which languages can it write in?',
	},
	{
		answer:
			'Only you. Letters are tied to your account, and deleting the account erases them.',
		id: 'privacy',
		question: 'Who can see my letters?',
	},
]
