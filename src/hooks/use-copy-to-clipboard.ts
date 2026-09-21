import { useEffect, useRef, useState } from 'react'

const FEEDBACK_DURATION_MS = 2000

type CopyStatus = 'idle' | 'copied' | 'failed'

// ═══════════════════════════════════════════════════════════════════════════
//   The Clipboard API rejects outside a secure context, in some embedded
//   browsers and when the page lost focus mid-click. That is reported as
//   'failed' so the button can say so — a silent no-op would leave the user
//   pasting whatever they had copied before.
// ═══════════════════════════════════════════════════════════════════════════
export function useCopyToClipboard() {
	const [status, setStatus] = useState<CopyStatus>('idle')
	const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

	useEffect(() => () => clearTimeout(resetTimer.current), [])

	const copy = async (text: string) => {
		clearTimeout(resetTimer.current)

		try {
			await navigator.clipboard.writeText(text)
			setStatus('copied')
		} catch {
			setStatus('failed')
		}

		resetTimer.current = setTimeout(
			() => setStatus('idle'),
			FEEDBACK_DURATION_MS,
		)
	}

	return { copy, status }
}
