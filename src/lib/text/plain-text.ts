const TAB = 0x09
const LINE_FEED = 0x0a
const CARRIAGE_RETURN = 0x0d
const FIRST_PRINTABLE = 0x20
const DELETE = 0x7f

function isAllowed(character: string): boolean {
	const code = character.codePointAt(0) ?? 0

	if (code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN) {
		return true
	}

	return code >= FIRST_PRINTABLE && code !== DELETE
}

// ═══════════════════════════════════════════════════════════════════════════
//   Postgres rejects a NUL in a text column, which would fail the save
//   after the letter was already generated.
// ═══════════════════════════════════════════════════════════════════════════
export function toPlainText(value: string): string {
	return Array.from(value).filter(isAllowed).join('')
}
