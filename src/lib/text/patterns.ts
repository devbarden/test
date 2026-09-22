// ═══════════════════════════════════════════════════════════════════════════
//   Every regular expression in the app, named for what it matches. None
//   is used with `test` and the `g` flag, so none carries lastIndex state
//   between callers.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//   One or more whitespace characters, tabs and non-breaking spaces
//   included: the gaps between search terms.
// ═══════════════════════════════════════════════════════════════════════════
export const WHITESPACE_RUN = /\s+/

// ═══════════════════════════════════════════════════════════════════════════
//   A blank line, even one holding spaces, between two paragraphs.
// ═══════════════════════════════════════════════════════════════════════════
export const PARAGRAPH_BREAK = /\n\s*\n/g

// ═══════════════════════════════════════════════════════════════════════════
//   CRLF (Windows) or a lone CR (old Mac): both become LF.
// ═══════════════════════════════════════════════════════════════════════════
export const NON_UNIX_LINE_BREAK = /\r\n?/g

// ═══════════════════════════════════════════════════════════════════════════
//   Spaces or tabs before the end of any line (`m`: every line, not the
//   whole string).
// ═══════════════════════════════════════════════════════════════════════════
export const BLANKS_BEFORE_LINE_END = /[ \t]+$/gm

// ═══════════════════════════════════════════════════════════════════════════
//   Three or more line feeds in a row: two blank lines or more.
// ═══════════════════════════════════════════════════════════════════════════
export const EXCESS_BLANK_LINES = /\n{3,}/g

// ═══════════════════════════════════════════════════════════════════════════
//   Any character that means something inside a regular expression; the
//   term is inserted into one, so each gets a backslash first.
// ═══════════════════════════════════════════════════════════════════════════
export const REGEXP_SPECIAL_CHARACTER = /[.*+?^${}()|[\]\\]/g

// ═══════════════════════════════════════════════════════════════════════════
//   A request id worth echoing in a header: letters, digits, `_`, `.` and
//   `-`, between 1 and 128 of them, nothing else.
// ═══════════════════════════════════════════════════════════════════════════
export const PLAIN_BOUNDED_ID = /^[\w.-]{1,128}$/
