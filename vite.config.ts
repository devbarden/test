import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { UNLOCALIZED_PREFIXES } from './src/lib/i18n/localized-routes.ts'

// ═══════════════════════════════════════════════════════════════════════════
//   Two locale zones, because the two halves of the product carry the choice
//   differently:
//
//   - The landing: every language is a real URL (`/ru/`), so the URL decides
//     what is rendered and a crawler can find each translation. The cookie
//     trails behind it — Paraglide writes the resolved locale there on every
//     visit — because that cookie is the ONLY thing the zone below can read.
//   - The app, sign-in and the API: no `/ru` prefix exists for them (see
//     lib/i18n/localized-routes), and Paraglide maps every bare path to the BASE
//     locale — url-first would pin them to English forever. So they read the
//     cookie, and a visitor who read the landing in Russian gets a Russian
//     sign-in and a Russian workspace.
//
//   Which paths belong to the cookie zone is one list, shared with the
//   router (UNLOCALIZED_PREFIXES in src/lib/i18n/localized-routes.ts).
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
//   Icons, the social card and the manifest keep stable names while their
//   content can change (`npm run assets:build`), so they get a day, never
//   `immutable` — a year-long cache would pin a stale favicon on every
//   visitor who ever loaded one. Nitro serves public/ before the server
//   entry runs, so a route rule is the only place that reaches them.
// ═══════════════════════════════════════════════════════════════════════════
const BRAND_FILES = [
	'/apple-touch-icon.png',
	'/favicon.ico',
	'/favicon.svg',
	'/icon-192.png',
	'/icon-512.png',
	'/manifest.json',
	'/og-image.png',
]

const COOKIE_LOCALE_STRATEGY: (
	| 'baseLocale'
	| 'cookie'
	| 'preferredLanguage'
)[] = ['cookie', 'preferredLanguage', 'baseLocale']

export default defineConfig({
	// ═════════════════════════════════════════════════════════════════════════
	//   Every module names its outermost element `.root`, so a hashed class
	//   has to carry its file to mean anything in the element inspector:
	//   `button-module__root__x7Kq2`, not `_root_x7Kq2`. The name is built from
	//   the path alone, so the server render and the client bundle agree.
	// ═════════════════════════════════════════════════════════════════════════
	css: {
		devSourcemap: true,
		modules: { generateScopedName: '[name]__[local]__[hash:base64:5]' },
	},
	plugins: [
		tanstackStart(),
		nitro({
			compressPublicAssets: { brotli: true, gzip: true },
			plugins: ['./src/backend/lifecycle/server-lifecycle.nitro.ts'],
			// ═══════════════════════════════════════════════════════════════
			//   Rolldown warns about every "use client" it bundles, and on the
			//   server that directive means nothing: React Query alone printed
			//   35 of these on each build, burying any warning that matters.
			// ═══════════════════════════════════════════════════════════════
			rolldownConfig: { checks: { moduleLevelDirective: false } },
			// ═══════════════════════════════════════════════════════════════════
			//   Hashed bundles under /assets get an immutable rule from Nitro on
			//   their own; the fonts in public/ have stable names and would
			//   otherwise ship with no cache-control at all. They are vendored
			//   and never change in place, so a year is safe.
			// ═══════════════════════════════════════════════════════════════════
			routeRules: {
				'/fonts/**': {
					headers: { 'cache-control': 'public, max-age=31536000, immutable' },
				},
				...Object.fromEntries(
					BRAND_FILES.map((path) => [
						path,
						{ headers: { 'cache-control': 'public, max-age=86400' } },
					]),
				),
			},
		}),
		// ═══════════════════════════════════════════════════════════════════
		//   `outputStructure` is pinned: the plugin's default differs between
		//   dev and build, and the CLI (`npm run i18n:generate`) always writes
		//   `message-modules`. With the default, a dev server started after a
		//   CLI compile rewrites the structure at startup and prunes the very
		//   files the SSR module runner is importing.
		// ═══════════════════════════════════════════════════════════════════
		paraglideVitePlugin({
			cookieName: 'PARAGLIDE_LOCALE',
			outdir: './src/paraglide',
			outputStructure: 'message-modules',
			project: './project.inlang',
			routeStrategies: UNLOCALIZED_PREFIXES.flatMap((prefix) => [
				{ match: `/${prefix}`, strategy: COOKIE_LOCALE_STRATEGY },
				{ match: `/${prefix}/:path(.*)?`, strategy: COOKIE_LOCALE_STRATEGY },
			]),
			strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
		}),
		viteReact(),
		// ═══════════════════════════════════════════════════════════════════
		//   Vite 8 transforms with Oxc, not Babel, so the React Compiler runs
		//   through a Babel pass of its own. The preset's filter sends it only
		//   the files that can hold a component or a hook. The Rust port behind
		//   `viteReact({ compiler: true })` is still experimental.
		//
		//   Paraglide's generated modules hold no components, and compiling
		//   every message module on each change is pure dev-server latency.
		// ═══════════════════════════════════════════════════════════════════
		babel({
			exclude: [/[\\/]src[\\/]paraglide[\\/]/],
			presets: [reactCompilerPreset()],
		}),
	],
	// ═════════════════════════════════════════════════════════════════════════
	//   One copy of Clerk's shared runtime, so every hook reads the context of
	//   the one ClerkProvider instead of throwing "can only be used within
	//   <ClerkProvider />" from a duplicated module.
	// ═════════════════════════════════════════════════════════════════════════
	resolve: { dedupe: ['@clerk/react', '@clerk/shared'], tsconfigPaths: true },
})
