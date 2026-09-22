import { BLANKS_BEFORE_LINE_END, EXCESS_BLANK_LINES, NON_UNIX_LINE_BREAK } from './patterns'

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

// ═══════════════════════════════════════════════════════════════════════════
//   Models end lines with Markdown's two trailing spaces and CRLF; copied
//   into an application form those become stray blanks.
// ═══════════════════════════════════════════════════════════════════════════
export function tidyWhitespace(value: string): string {
	return value
		.replace(NON_UNIX_LINE_BREAK, '\n')
		.replace(BLANKS_BEFORE_LINE_END, '')
		.replace(EXCESS_BLANK_LINES, '\n\n')
		.trim()
}
