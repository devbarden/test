import type en from '../../../messages/en.json'
import type ru from '../../../messages/ru.json'

// ═══════════════════════════════════════════════════════════════════════════
//   Paraglide silently falls back to English for a missing key; assigning
//   each shape to the other makes it a type error.
// ═══════════════════════════════════════════════════════════════════════════
export function russianHasEveryKey(messages: typeof ru): typeof en {
	return messages
}

export function englishHasEveryKey(messages: typeof en): typeof ru {
	return messages
}
