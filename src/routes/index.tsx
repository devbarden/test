import { createFileRoute } from '@tanstack/react-router'
import { landingHead } from '@/screens/landing/landing-head'
import { LandingScreen } from '@/screens/landing/landing-screen'

// ═══════════════════════════════════════════════════════════════════════════
//   component and head() come from separate modules: the router's code
//   splitting moves `component` into a chunk of its own only when nothing
//   else in this file shares its import. Sharing one with head() — which
//   always runs eagerly — drags the whole landing into the entry chunk
//   that every app page downloads.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/')({
	component: LandingScreen,
	head: landingHead,
})
