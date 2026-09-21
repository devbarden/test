import type en from '../../../messages/en.json'
import type ru from '../../../messages/ru.json'

// ═══════════════════════════════════════════════════════════════════════════
//   Both locales must carry the same keys. Paraglide silently falls back to
//   English for a key missing in Russian, so the gap would ship unnoticed;
//   assigning each file's shape to the other makes it a typecheck error that
//   names the missing key.
// ═══════════════════════════════════════════════════════════════════════════
export function russianHasEveryKey(messages: typeof ru): typeof en {
	return messages
}

export function englishHasEveryKey(messages: typeof en): typeof ru {
	return messages
}
