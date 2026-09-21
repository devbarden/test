import { describe, expect, it } from 'vitest'
import { readableStreamFrom } from '@/lib/readable-stream-from'
import { createLineSplitter } from './line-splitter'

async function split(chunks: string[]): Promise<string[]> {
	async function* source() {
		yield* chunks
	}

	const lines: string[] = []

	for await (const line of readableStreamFrom(source()).pipeThrough(
		createLineSplitter(),
	)) {
		lines.push(line)
	}

	return lines
}

describe('createLineSplitter', () => {
	it('re-cuts chunks on line boundaries', async () => {
		expect(await split(['{"a":', '1}\n{"b"', ':2}\n{"c":3}\n'])).toEqual([
			'{"a":1}',
			'{"b":2}',
			'{"c":3}',
		])
	})

	it('skips blank lines and emits an unterminated last line', async () => {
		expect(await split(['one\n\n', 'two'])).toEqual(['one', 'two'])
	})
})
