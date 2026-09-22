import babel from '@rolldown/plugin-babel'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const BRAND_FILES = [
	'/apple-touch-icon.png',
	'/favicon.ico',
	'/favicon.svg',
	'/icon-192.png',
	'/icon-512.png',
	'/manifest.json',
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
			rolldownConfig: { checks: { moduleLevelDirective: false } },
			routeRules: {
				'/fonts/**': {
					headers: { 'cache-control': 'public, max-age=31536000, immutable' },
				},
				...Object.fromEntries(
					BRAND_FILES.map((path) => [path, { headers: { 'cache-control': 'public, max-age=86400' } }]),
				),
			},
		}),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
	resolve: { dedupe: ['@clerk/react', '@clerk/shared'], tsconfigPaths: true },
})
