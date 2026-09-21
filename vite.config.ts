import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { UNLOCALIZED_PREFIXES } from './src/lib/i18n/localized-routes.ts'

// ═══════════════════════════════════════════════════════════════════════════
//   Landing pages carry the locale in the URL (`/ru/`); the app, sign-in and
//   the API have no prefix and read it from the cookie instead.
// ═══════════════════════════════════════════════════════════════════════════
const COOKIE_LOCALE_STRATEGY: (
	| 'baseLocale'
	| 'cookie'
	| 'preferredLanguage'
)[] = ['cookie', 'preferredLanguage', 'baseLocale']

// ═══════════════════════════════════════════════════════════════════════════
//   Stable names with changing content: cached for a day, never immutable.
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

export default defineConfig({
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
			//   "use client" means nothing on the server; hush its warnings.
			// ═══════════════════════════════════════════════════════════════
			rolldownConfig: { checks: { moduleLevelDirective: false } },
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
		//   Pinned to what the CLI writes, or dev prunes files SSR is importing.
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
		//   React Compiler needs its own Babel pass under Vite 8 (Oxc).
		// ═══════════════════════════════════════════════════════════════════
		babel({
			exclude: [/[\\/]src[\\/]paraglide[\\/]/],
			presets: [reactCompilerPreset()],
		}),
	],
	// ═════════════════════════════════════════════════════════════════════════
	//   One copy of Clerk, or its hooks miss the ClerkProvider context.
	// ═════════════════════════════════════════════════════════════════════════
	resolve: { dedupe: ['@clerk/react', '@clerk/shared'], tsconfigPaths: true },
})
