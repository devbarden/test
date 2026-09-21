type CharacterCountProps = {
	length: number
	max: number
}

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
