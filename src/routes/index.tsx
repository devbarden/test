import { createFileRoute } from '@tanstack/react-router'
import { landingHead } from '@/screens/landing/landing-head'
import { LandingScreen } from '@/screens/landing/landing-screen'

// ═══════════════════════════════════════════════════════════════════════════
//   component and head() live in separate modules, or the whole landing
//   lands in every app page's entry chunk.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/')({
	component: LandingScreen,
	head: landingHead,
})
