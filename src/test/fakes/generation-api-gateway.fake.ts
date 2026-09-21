import { vi } from 'vitest'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'

export function createFakeGateway(
	stream: () => AsyncGenerator<string>,
): GenerationApiGateway {
	return { openStream: vi.fn(async () => stream()) }
}
