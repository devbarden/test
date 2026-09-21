import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ═══════════════════════════════════════════════════════════════════════════
//   The rule "every message exists in every locale" enforced as a check rather
//   than as a convention, because a convention cannot fail a build.
//
//   A missing key is not a compile error and not a crash: Paraglide falls back
//   to the base locale, so the screen renders — in English, inside an otherwise
//   translated page. That is precisely the failure nobody notices in review and
//   every user notices immediately. Same for a placeholder: `{count}` dropped
//   from a translation renders a sentence with a hole in it, and the only
//   moment it is cheap to catch is here.
//
//   Run by `npm run i18n:check`, and by `npm run typecheck` before it, so a
//   pull request cannot add an English string without its translation.
// ═══════════════════════════════════════════════════════════════════════════

const BASE_LOCALE = 'en'

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')

const messagesDir = join(appDir, 'messages')

// ═══════════════════════════════════════════════════════════════════════════
//   The locale list comes from the inlang project, never from whatever
//   happens to be sitting in messages/. Reading the directory would make a
//   DELETED catalog invisible — nine files present and the tenth simply not
//   checked — which is the one failure mode this script exists to make loud.
// ═══════════════════════════════════════════════════════════════════════════
const settings = JSON.parse(
	readFileSync(join(appDir, 'project.inlang', 'settings.json'), 'utf8'),
) as { baseLocale: string; locales: string[] }

type Messages = Record<string, string>

type MessageTree = { [key: string]: MessageTree | string }

// ═══════════════════════════════════════════════════════════════════════════
//   The catalogs are stored nested (one object per namespace) because that is
//   what the inlang editor and the message-format plugin read, but every
//   comparison below is about the LEAF a call site names — `m['app.nav.
//   billing']()`. Flattening once here is what lets the rest of this file talk
//   in the same key the application does, so a reported problem can be pasted
//   straight into a grep. `$schema` is dropped: it is metadata, not a message.
// ═══════════════════════════════════════════════════════════════════════════
function flatten(tree: MessageTree, prefix = ''): Messages {
	const flat: Messages = {}

	for (const [key, value] of Object.entries(tree)) {
		if (key === '$schema') continue

		const path = prefix ? `${prefix}.${key}` : key

		if (typeof value === 'string') {
			flat[path] = value
			continue
		}

		Object.assign(flat, flatten(value, path))
	}

	return flat
}

function readLocale(locale: string): Messages {
	return flatten(
		JSON.parse(
			readFileSync(join(messagesDir, `${locale}.json`), 'utf8'),
		) as MessageTree,
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   Placeholders are compared as a SET, not as a sequence: languages reorder
//   the clauses a sentence is built from, so `{used} of {total}` legitimately
//   becomes `{total} 中 {used}`. What must never change is WHICH values the
//   sentence asks for — an extra one renders as literal braces, a missing one
//   silently drops a number the sentence was about.
// ═══════════════════════════════════════════════════════════════════════════
function placeholders(message: string): Set<string> {
	return new Set(
		[...message.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(
			(match) => match[1] as string,
		),
	)
}

function difference(left: Set<string>, right: Set<string>): string[] {
	return [...left].filter((value) => !right.has(value))
}

const locales = settings.locales
	.filter((locale) => locale !== BASE_LOCALE)
	.sort()

const base = readLocale(BASE_LOCALE)
const baseKeys = Object.keys(base).sort()
const problems: string[] = []

for (const locale of locales) {
	if (!existsSync(join(messagesDir, `${locale}.json`))) {
		problems.push(
			`${locale}: no catalog at messages/${locale}.json, but project.inlang declares the locale`,
		)
		continue
	}

	const messages = readLocale(locale)

	for (const key of baseKeys) {
		const translated = messages[key]

		if (translated === undefined) {
			problems.push(`${locale}: missing key "${key}"`)
			continue
		}

		if (translated.trim().length === 0) {
			problems.push(`${locale}: empty translation for "${key}"`)
			continue
		}

		const expected = placeholders(base[key] as string)
		const actual = placeholders(translated)
		const missing = difference(expected, actual)
		const extra = difference(actual, expected)

		if (missing.length > 0) {
			problems.push(
				`${locale}: "${key}" drops placeholder(s) ${missing.map((name) => `{${name}}`).join(', ')}`,
			)
		}

		if (extra.length > 0) {
			problems.push(
				`${locale}: "${key}" invents placeholder(s) ${extra.map((name) => `{${name}}`).join(', ')}`,
			)
		}
	}

	for (const key of Object.keys(messages)) {
		if (base[key] === undefined) {
			problems.push(`${locale}: key "${key}" does not exist in ${BASE_LOCALE}`)
		}
	}
}

if (problems.length > 0) {
	console.error(
		`\n${problems.length} message problem(s) across ${locales.length} locale(s):\n`,
	)
	for (const problem of problems) console.error(`  ${problem}`)
	console.error(
		`\nEvery key in ${BASE_LOCALE}.json must exist, non-empty, in all of: ${locales.join(', ')}\n`,
	)
	process.exit(1)
}

console.info(
	`messages ok — ${baseKeys.length} keys × ${locales.length + 1} locales`,
)
