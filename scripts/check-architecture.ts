import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'

// ═══════════════════════════════════════════════════════════════════════════
//   The frontend's dependency rule, enforced rather than remembered. Code
//   flows one way:
//
//     routes  →  screens  →  features  →  components · hooks · lib
//
//   - Shared code (components, hooks, lib) knows no feature and no page.
//   - A feature never reaches up into a screen or a route, and never into
//     another feature unless ALLOWED_FEATURE_DEPENDENCIES says so: features
//     are combined in the screens that use them, not inside each other.
//   - A screen never imports another screen.
//
//   Server code (src/backend, *.server.ts, src/routes/api, src/test) keeps
//   its own layering and is not checked here; neither are tests.
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_FEATURE_DEPENDENCIES: Record<string, readonly string[]> = {
	generation: ['applications'],
}

const SKIPPED_PREFIXES = [
	'src/backend/',
	'src/generated/',
	'src/paraglide/',
	'src/routes/api/',
	'src/test/',
]

const SKIPPED_SUFFIXES = [
	'.server.ts',
	'.test.ts',
	'.test.tsx',
	'routeTree.gen.ts',
]

function isSkipped(path: string): boolean {
	return (
		SKIPPED_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
		SKIPPED_SUFFIXES.some((suffix) => path.endsWith(suffix))
	)
}

type Layer =
	| { kind: 'app' }
	| { kind: 'feature' | 'screen'; name: string }
	| { kind: 'shared' }
	| { kind: 'other' }

function layerOf(path: string): Layer {
	const [, top, name] = path.split('/')

	if (top === 'features' || top === 'screens') {
		return { kind: top === 'features' ? 'feature' : 'screen', name: name ?? '' }
	}
	if (
		top === 'components' ||
		top === 'hooks' ||
		top === 'lib' ||
		top === 'styles'
	) {
		return { kind: 'shared' }
	}
	if (top === 'routes' || /^src\/(router|server|start)\.tsx?$/.test(path)) {
		return { kind: 'app' }
	}
	return { kind: 'other' }
}

function violation(from: Layer, to: Layer): string | undefined {
	if (from.kind === 'shared' && to.kind !== 'shared' && to.kind !== 'other') {
		return `shared code imports a ${to.kind}`
	}
	if (from.kind === 'feature') {
		if (to.kind === 'screen' || to.kind === 'app') {
			return `a feature imports a ${to.kind === 'app' ? 'route' : 'screen'}`
		}
		if (
			to.kind === 'feature' &&
			to.name !== from.name &&
			!ALLOWED_FEATURE_DEPENDENCIES[from.name]?.includes(to.name)
		) {
			return `feature "${from.name}" imports feature "${to.name}"`
		}
	}
	if (from.kind === 'screen') {
		if (to.kind === 'app') return 'a screen imports a route'
		if (to.kind === 'screen' && to.name !== from.name) {
			return `screen "${from.name}" imports screen "${to.name}"`
		}
	}
	return undefined
}

function collect(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry)

		return statSync(path).isDirectory()
			? collect(path)
			: /\.tsx?$/.test(path)
				? [path]
				: []
	})
}

function target(specifier: string, from: string): string | undefined {
	if (specifier.startsWith('@/')) return `src/${specifier.slice(2)}`
	if (specifier.startsWith('.'))
		return normalize(join(dirname(from), specifier))
	return undefined
}

const problems: string[] = []

for (const file of collect('src')) {
	const path = relative(process.cwd(), file)

	if (isSkipped(path)) continue

	const from = layerOf(path)
	const source = readFileSync(file, 'utf8')

	for (const [, specifier] of source.matchAll(
		/(?:from|import)\s*\(?\s*'([^']+)'/g,
	)) {
		const to = target(specifier as string, path)
		const reason = to && violation(from, layerOf(to))

		if (reason) problems.push(`${path}  ${reason} (${specifier})`)
	}
}

if (problems.length > 0) {
	for (const problem of problems) console.error(problem)
	console.error(
		`\n${problems.length} import(s) break the layering (see CLAUDE.md).`,
	)
	process.exit(1)
}

console.info('Architecture: every import flows down.')
