import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

// ═══════════════════════════════════════════════════════════════════════════
//   Enforces the comment rule from CLAUDE.md: a comment is either a box
//   banner or it does not exist. In TypeScript that means `//` lines between
//   two identical `// ═══…` rules (text on `//   ` lines, blank `//` lines
//   allowed); in CSS, one `/* ═══… */` block. The only other comments
//   allowed are tool directives: `// biome-ignore …`, `// @ts-expect-error …`
//   and `// TODO: …`.
//
//   A rule wins over review because review gets tired: a trailing
//   `// like this` slips through on the tenth file of a diff, and then the
//   next change copies it.
// ═══════════════════════════════════════════════════════════════════════════

const ROOTS = ['src', 'e2e', 'scripts']
const ROOT_FILES = [
	'vite.config.ts',
	'vitest.config.ts',
	'playwright.config.ts',
	'prisma.config.ts',
]
const IGNORED = ['src/generated', 'src/paraglide', 'src/routeTree.gen.ts']
const DIRECTIVE = /^\/\/ (biome-ignore|@ts-expect-error|TODO:)/
const TS_RULE = /^\/\/ ═+$/
const CSS_OPEN = /^\/\* ═+$/
const CSS_CLOSE = /^[\t ]*═+ \*\/$/

type Violation = { file: string; line: number; reason: string }

function collectFiles(): string[] {
	const files: string[] = [...ROOT_FILES]

	const walk = (dir: string) => {
		for (const entry of readdirSync(dir)) {
			const path = join(dir, entry)

			if (IGNORED.some((ignored) => path.startsWith(ignored))) continue

			if (statSync(path).isDirectory()) walk(path)
			else if (['.ts', '.tsx', '.css'].includes(extname(path))) files.push(path)
		}
	}

	for (const root of ROOTS) walk(root)

	return files
}

// ═══════════════════════════════════════════════════════════════════════════
//   Blanks out string, template and regex literals so a `//` inside a URL,
//   a message or a pattern is not mistaken for a comment. Deliberately
//   simple: it only has to be right about where comments can start, not
//   parse TypeScript.
// ═══════════════════════════════════════════════════════════════════════════
function withoutStrings(line: string): string {
	return line
		.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""')
		.replace(/(?<=[(,=!?:&|]\s*)\/(?:\\.|[^/\n\\])+\/[a-z]*/g, '""')
}

function checkTypeScript(file: string, lines: string[]): Violation[] {
	const violations: Violation[] = []
	let openRule: { indent: string; line: number; rule: string } | undefined

	lines.forEach((raw, index) => {
		const line = index + 1
		const trimmed = raw.trim()
		const indent = raw.slice(0, raw.length - raw.trimStart().length)

		if (TS_RULE.test(trimmed)) {
			if (!openRule) {
				openRule = { indent, line, rule: trimmed }
			} else if (trimmed !== openRule.rule || indent !== openRule.indent) {
				violations.push({
					file,
					line,
					reason: 'closing rule does not match its opening rule',
				})
				openRule = undefined
			} else {
				openRule = undefined
			}
			return
		}

		if (openRule) {
			if (trimmed === '//' || trimmed.startsWith('//   ')) return

			violations.push({ file, line, reason: 'banner is not closed' })
			openRule = undefined
		}

		if (trimmed.startsWith('//')) {
			if (!DIRECTIVE.test(trimmed)) {
				violations.push({ file, line, reason: 'comment outside a banner' })
			}
			return
		}

		const code = withoutStrings(raw)

		if (/\/\*/.test(code) && !/^\{?\/\* ═+$/.test(trimmed)) {
			violations.push({ file, line, reason: 'block comment in TypeScript' })
		} else if (/(^|[^:])\/\/(?!\/)/.test(code) && !/https?:\/\//.test(raw)) {
			violations.push({ file, line, reason: 'trailing comment' })
		}
	})

	if (openRule) {
		violations.push({
			file,
			line: openRule.line,
			reason: 'banner is not closed',
		})
	}

	return violations
}

function checkCss(file: string, lines: string[]): Violation[] {
	const violations: Violation[] = []
	let openLine: number | undefined

	lines.forEach((raw, index) => {
		const trimmed = raw.trim()
		const line = index + 1

		if (openLine === undefined && raw.includes('/*')) {
			if (CSS_OPEN.test(trimmed)) openLine = line
			else
				violations.push({
					file,
					line,
					reason: 'CSS comment that is not a banner',
				})
			return
		}

		if (openLine !== undefined && CSS_CLOSE.test(raw)) openLine = undefined
	})

	if (openLine !== undefined) {
		violations.push({ file, line: openLine, reason: 'banner is not closed' })
	}

	return violations
}

const violations = collectFiles().flatMap((file) => {
	const lines = readFileSync(file, 'utf8').split('\n')

	return extname(file) === '.css'
		? checkCss(file, lines)
		: checkTypeScript(file, lines)
})

for (const { file, line, reason } of violations) {
	console.error(`${relative(process.cwd(), file)}:${line}  ${reason}`)
}

if (violations.length > 0) {
	console.error(
		`\n${violations.length} comment(s) break the banner rule (see CLAUDE.md).`,
	)
	process.exit(1)
}

console.info('Comments: every one is a banner.')
