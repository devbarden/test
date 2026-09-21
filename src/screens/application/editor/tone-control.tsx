import {
	SegmentedControl,
	type SegmentedOption,
} from '@/components/ui/segmented-control'
import {
	LETTER_TONES,
	type LetterTone,
} from '@/features/applications/model/application-tone'
import { m } from '@/paraglide/messages'

const TONE_LABELS: Record<LetterTone, () => string> = {
	confident: () => m['editor.tone.confident'](),
	professional: () => m['editor.tone.professional'](),
	warm: () => m['editor.tone.warm'](),
}

type ToneControlProps = {
	onChange: (tone: LetterTone) => void
	value: LetterTone
}

export function ToneControl({ onChange, value }: ToneControlProps) {
	const options: SegmentedOption<LetterTone>[] = LETTER_TONES.map((tone) => ({
		label: TONE_LABELS[tone](),
		value: tone,
	}))

	return (
		<SegmentedControl
			label={m['editor.tone.label']()}
			onChange={onChange}
			options={options}
			value={value}
		/>
	)
}
