import type { ApiError } from '@/lib/api/api-error'

// ═══════════════════════════════════════════════════════════════════════════
//   The one error the generation client throws for its own reasons; a Stop
//   surfaces as the abort itself, so a caller can tell the two apart.
// ═══════════════════════════════════════════════════════════════════════════
export class LetterGenerationFailure extends Error {
	constructor(readonly error: ApiError) {
		super(`Letter generation failed: ${error.code}`)
		this.name = 'LetterGenerationFailure'
	}
}
