import type { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   One JSON value per line, each checked against the schema as it
//   arrives; a line that is not one ends the iteration with a throw.
// ═══════════════════════════════════════════════════════════════════════════
export type ByteStream = ReadableStream<Uint8Array<ArrayBuffer>>

export async function* readNdjson<Schema extends z.ZodType>(
	body: ByteStream,
	schema: Schema,
): AsyncGenerator<z.output<Schema>> {
	for await (const line of readLines(body)) {
		yield schema.parse(JSON.parse(line))
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   A chunk may end mid-line, so the tail is kept until the next chunk
//   completes it. A reader loop, not `for await` over the stream: Safari
//   cannot iterate a ReadableStream.
// ═══════════════════════════════════════════════════════════════════════════
async function* readLines(body: ByteStream): AsyncGenerator<string> {
	const reader = body.pipeThrough(new TextDecoderStream()).getReader()
	let tail = ''

	try {
		for (;;) {
			const { done, value } = await reader.read()

			if (done) break

			const lines = `${tail}${value}`.split('\n')

			tail = lines.pop() ?? ''
			yield* lines.filter((line) => line.trim())
		}
	} finally {
		reader.releaseLock()
	}

	if (tail.trim()) yield tail
}
