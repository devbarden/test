export type Money = {
	amount: number
	currency: string
}

export function formatMoney({ amount, currency }: Money): string {
	const fractionDigits = amount % 100 === 0 ? 0 : 2

	return new Intl.NumberFormat('en', {
		currency,
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
		style: 'currency',
	}).format(amount / 100)
}
