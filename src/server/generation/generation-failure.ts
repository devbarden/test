import type { GenerationError } from '@/features/generation/protocol'

// ═══════════════════════════════════════════════════════════════════════════
//   Carries two audiences at once: `error` is what the browser may see (a
//   code, maybe a retry hint), `message` is what the log needs (upstream
//   status, request id). Nothing from the upstream's own error body is ever
//   forwarded to the client.
// ═══════════════════════════════════════════════════════════════════════════
export class GenerationFailure extends Error {
	readonly error: GenerationError

	constructor(error: GenerationError, message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'GenerationFailure'
		this.error = error
	}
}
