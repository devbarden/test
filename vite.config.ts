import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		tsconfigPaths({ projects: ['./tsconfig.json'] }),
		tanstackStart(),
		nitro({
			compressPublicAssets: { brotli: true, gzip: true },
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
			},
		}),
		viteReact({
			babel: { plugins: [['babel-plugin-react-compiler']] },
		}),
	],
	// ═════════════════════════════════════════════════════════════════════════
	//   One copy of Clerk's shared runtime, so every hook reads the context of
	//   the one ClerkProvider instead of throwing "can only be used within
	//   <ClerkProvider />" from a duplicated module.
	// ═════════════════════════════════════════════════════════════════════════
	resolve: { dedupe: ['@clerk/react', '@clerk/shared'] },
})
