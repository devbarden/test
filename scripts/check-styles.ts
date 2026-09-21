import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'

// ═══════════════════════════════════════════════════════════════════════════
//   Enforces the stylesheet rules from docs/styles.md, the ones Biome cannot
//   see because they span a stylesheet and the component that imports it:
//
//   - every stylesheet sits in the cascade layer of its folder, as one
//     `@layer <name> { … }` block, and index.css declares the order
//   - colours are roles: no literal and no palette name outside tokens.css
//   - media queries use only the breakpoint set, in range syntax
//   - a CSS module is imported as `styles` by files in its own folder,
//     read only as `styles.name`, and every class it defines is read by one
//     of them — so a class cannot go stale, and a typo cannot fail silently
//   - stacking uses the z-index scale; `!important` stays in src/styles
// ═══════════════════════════════════════════════════════════════════════════

const LAYERS = [
	'reset',
	'tokens',
	'base',
	'ui',
	'components',
	'features',
	'screens',
	'utilities',
] as const

const GLOBAL_LAYERS: Record<string, string> = {
	'base.css': 'base',
	'reset.css': 'reset',
	'tokens.css': 'tokens',
	'utilities.css': 'utilities',
	'view-transitions.css': 'base',
}

const UNLAYERED = [
	'src/styles/clerk.css',
	'src/styles/fonts.css',
	'src/styles/index.css',
]

const BREAKPOINTS = ['30rem', '40rem', '48rem', '60rem', '64rem']

const COLOR_LITERAL =
	/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i

const MODULE_IMPORT = /import\s+(\w+)\s+from\s+'([^']+\.module\.css)'/g

type Problem = { file: string; message: string }

const problems: Problem[] = []

function report(file: string, message: string) {
	problems.push({ file, message })
}

function collect(dir: string, extensions: string[]): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry)

		if (statSync(path).isDirectory()) return collect(path, extensions)
		return extensions.some((extension) => path.endsWith(extension))
			? [path]
			: []
	})
}

function withoutComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function withoutStrings(css: string): string {
	return css.replace(/"[^"]*"|'[^']*'/g, '""')
}

function expectedLayer(path: string): string | undefined {
	if (path.startsWith('src/styles/')) return GLOBAL_LAYERS[basename(path)]
	if (path.startsWith('src/components/ui/')) return 'ui'
	if (path.startsWith('src/components/')) return 'components'
	if (path.startsWith('src/features/')) return 'features'
	if (path.startsWith('src/screens/')) return 'screens'
	return undefined
}

// ═══════════════════════════════════════════════════════════════════════════
//   The whole file must be one block: the opening `@layer x {` and the
//   brace that closes it at the very end, with depth never reaching zero
//   in between — a rule after the block would land in no layer at all and
//   beat every layered one.
// ═══════════════════════════════════════════════════════════════════════════
function checkLayer(path: string, css: string) {
	if (UNLAYERED.includes(path)) return

	const layer = expectedLayer(path)

	if (!layer) {
		report(
			path,
			'stylesheet outside src/styles, components, features or screens',
		)
		return
	}

	const code = withoutStrings(withoutComments(css)).trim()
	const opening = code.match(/^@layer\s+([\w.-]+)\s*\{/)

	if (!opening) {
		report(path, `must be wrapped in one \`@layer ${layer} { … }\` block`)
		return
	}
	if (opening[1] !== layer) {
		report(
			path,
			`is in layer "${opening[1]}", its folder's layer is "${layer}"`,
		)
		return
	}

	let depth = 0

	for (let index = 0; index < code.length; index += 1) {
		if (code[index] === '{') depth += 1
		if (code[index] === '}') depth -= 1
		if (depth === 0 && index > opening[0].length && index < code.length - 1) {
			report(path, `has rules outside its \`@layer ${layer}\` block`)
			return
		}
	}
}

function checkLayerOrder(css: string) {
	const statement = withoutComments(css).match(/@layer\s+([^;{]+);/)
	const order = statement?.[1]?.split(',').map((name) => name.trim())

	if (order?.join() !== LAYERS.join()) {
		report(
			'src/styles/index.css',
			`must declare \`@layer ${LAYERS.join(', ')};\` before anything else`,
		)
	}
}

function checkValues(path: string, css: string) {
	const code = withoutComments(css)
	const isTokens = path === 'src/styles/tokens.css'

	code.split('\n').forEach((line, index) => {
		const at = `${path}:${index + 1}`

		if (!isTokens && COLOR_LITERAL.test(line)) {
			report(at, 'colour literal — name a role from tokens.css instead')
		}
		if (!isTokens && line.includes('--palette-')) {
			report(at, 'palette colour — name a role from tokens.css instead')
		}
		if (!path.startsWith('src/styles/') && line.includes('!important')) {
			report(at, '`!important` — layers decide precedence here')
		}

		const zIndex = line.match(/z-index:\s*([^;]+);/)

		if (zIndex && !zIndex[1]?.includes('var(--z-')) {
			report(at, 'z-index outside the --z-* scale')
		}

		const media = line.match(/@media\s+([^{]+)\{/)

		if (media?.[1]) checkMedia(at, media[1])
	})
}

function checkMedia(at: string, query: string) {
	if (/(?:min|max)-(?:width|height)/.test(query)) {
		report(at, 'min-/max-width — write the range syntax, `(width < 40rem)`')
	}

	for (const [feature] of query.matchAll(/\([^()]*\bwidth\b[^()]*\)/g)) {
		const range = feature.match(/^\(width (<|>=) ([\d.]+rem)\)$/)

		if (!range || !BREAKPOINTS.includes(range[2] as string)) {
			report(
				at,
				`${feature} is not a breakpoint — use \`(width < x)\` or \`(width >= x)\` with x in ${BREAKPOINTS.join(', ')}`,
			)
		}
	}
}

function withoutGlobals(selector: string): string {
	let result = ''
	let index = 0

	while (index < selector.length) {
		if (selector.startsWith(':global(', index)) {
			let depth = 0

			do {
				if (selector[index] === '(') depth += 1
				if (selector[index] === ')') depth -= 1
				index += 1
			} while (depth > 0 && index < selector.length)
		} else {
			result += selector[index]
			index += 1
		}
	}

	return result
}

function definedClasses(css: string): Set<string> {
	const code = withoutStrings(withoutComments(css))
	const classes = new Set<string>()

	for (const [, prelude] of code.matchAll(/([^{};]+)\{/g)) {
		const selector = (prelude ?? '').trim()

		if (selector.startsWith('@')) continue

		for (const [, name] of withoutGlobals(selector).matchAll(
			/\.(-?[_a-zA-Z][\w-]*)/g,
		)) {
			classes.add(name as string)
		}
	}

	return classes
}

const stylesheets = collect('src', ['.css']).map((file) =>
	relative(process.cwd(), file),
)

for (const path of stylesheets) {
	const css = readFileSync(path, 'utf8')

	if (path.endsWith('.module.css') === path.startsWith('src/styles/')) {
		report(
			path,
			path.startsWith('src/styles/')
				? 'src/styles holds global stylesheets, not modules'
				: 'a component stylesheet must be a CSS module (*.module.css)',
		)
	}

	if (path === 'src/styles/index.css') checkLayerOrder(css)
	checkLayer(path, css)
	checkValues(path, css)
}

const readers = new Map<string, { file: string; names: Set<string> }[]>()

for (const file of collect('src', ['.ts', '.tsx'])) {
	const path = relative(process.cwd(), file)
	const source = readFileSync(path, 'utf8')

	for (const [, binding, specifier] of source.matchAll(MODULE_IMPORT)) {
		if (!specifier?.startsWith('./') || specifier.slice(2).includes('/')) {
			report(path, `imports ${specifier} — a module belongs to its own folder`)
			continue
		}
		if (binding !== 'styles') {
			report(path, `imports ${specifier} as "${binding}" — name it \`styles\``)
			continue
		}
		if (/\bstyles\[/.test(source)) {
			report(
				path,
				'reads `styles[…]` — map each variant to `styles.name` explicitly',
			)
		}

		const module = join(dirname(path), specifier)
		const names = new Set(
			[...source.matchAll(/\bstyles\.(\w+)/g)].map(
				([, name]) => name as string,
			),
		)

		readers.set(module, [...(readers.get(module) ?? []), { file: path, names }])
	}
}

for (const module of stylesheets.filter((path) =>
	path.endsWith('.module.css'),
)) {
	const defined = definedClasses(readFileSync(module, 'utf8'))
	const moduleReaders = readers.get(module) ?? []
	const read = new Set(moduleReaders.flatMap(({ names }) => [...names]))

	if (moduleReaders.length === 0) report(module, 'is imported by no component')

	for (const name of defined) {
		if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
			report(module, `.${name} — class names are camelCase`)
		}
		if (moduleReaders.length > 0 && !read.has(name)) {
			report(module, `.${name} is never read by a component`)
		}
	}

	for (const { file, names } of moduleReaders) {
		for (const name of names) {
			if (!defined.has(name)) {
				report(file, `styles.${name} is not defined in ${basename(module)}`)
			}
		}
	}
}

if (problems.length > 0) {
	for (const { file, message } of problems) console.error(`${file}  ${message}`)
	console.error(
		`\n${problems.length} problem(s) break the stylesheet rules (see docs/styles.md).`,
	)
	process.exit(1)
}

console.info('Styles: every rule is layered, tokenised and read.')
