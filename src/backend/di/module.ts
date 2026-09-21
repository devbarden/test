import type { Resolver } from 'awilix'

// ═══════════════════════════════════════════════════════════════════════════
//   A module is a plain map of awilix registrations. What it contributes to
//   the container's cradle is derived from the registrations themselves,
//   so a factory's return type is the only declaration of what it provides
//   — there is no hand-written interface to keep in step with it.
// ═══════════════════════════════════════════════════════════════════════════
export type ContainerModule = Record<string, Resolver<unknown>>

export type CradleOf<Module extends ContainerModule> = {
	[Name in keyof Module]: Module[Name] extends Resolver<infer Value>
		? Value
		: never
}
