import { useEffect, useRef, useState } from 'react'

const FEEDBACK_DURATION_MS = 2000

type CopyStatus = 'idle' | 'copied' | 'failed'

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

		resetTimer.current = setTimeout(() => setStatus('idle'), FEEDBACK_DURATION_MS)
	}

	return { copy, status }
}
