export type Money = {
	amount: number
	currency: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Amounts arrive in minor units (cents), as Clerk sends them. A whole
//   price is shown without decimals — "$9", not "$9.00" — and the
//   locale decides where the symbol goes.
// ═══════════════════════════════════════════════════════════════════════════
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
