import type { Resolver } from 'awilix'

export type ContainerModule = Record<string, Resolver<unknown>>

export type CradleOf<Module extends ContainerModule> = {
	[Name in keyof Module]: Module[Name] extends Resolver<infer Value>
		? Value
		: never
}
