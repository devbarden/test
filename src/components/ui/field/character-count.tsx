type CharacterCountProps = {
	length: number
	max: number
}

// ═══════════════════════════════════════════════════════════════════════════
//   Only the overflow is announced. A live region that spoke on every
//   keystroke would read "123 of 1200" to a screen-reader user after each
//   letter they type; they need to hear about the limit once it matters.
// ═══════════════════════════════════════════════════════════════════════════
export function CharacterCount({ length, max }: CharacterCountProps) {
	const overflow = length - max

	return (
		<>
			<span aria-hidden="true">{`${length}/${max}`}</span>
			<span aria-live="polite" className="visually-hidden">
				{overflow > 0
					? `${overflow} characters over the ${max} character limit`
					: `Up to ${max} characters`}
			</span>
		</>
	)
}
