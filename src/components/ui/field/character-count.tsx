import { m } from '@/paraglide/messages'

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
					? m['field.overLimit']({ max, overflow })
					: m['field.upTo']({ max })}
			</span>
		</>
	)
}
