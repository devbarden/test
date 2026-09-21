export type Money = {
	amount: number
	currency: string
}

export function formatMoney(
	{ amount, currency }: Money,
	locale: string,
): string {
	const fractionDigits = amount % 100 === 0 ? 0 : 2

	return new Intl.NumberFormat(locale, {
		currency,
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
		style: 'currency',
	}).format(amount / 100)
}
