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
//   Removes ASCII control characters, keeping tabs and line breaks. Text in
//   this app is prose typed by a person or written by a model, and neither
//   has a use for them — while Postgres refuses a NUL in a text column
//   outright, which would fail a save AFTER a letter had already been
//   generated and paid for.
// ═══════════════════════════════════════════════════════════════════════════
export function toPlainText(value: string): string {
	return Array.from(value).filter(isAllowed).join('')
}
