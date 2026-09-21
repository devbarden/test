import { createServer } from 'node:http'
import {
	BREAK_MIDSTREAM,
	FAKE_GENERATION_API_PORT,
	FAKE_GENERATION_API_TOKEN,
} from './e2e-environment.ts'

// ═══════════════════════════════════════════════════════════════════════════
//   A local stand-in for the Generation API, speaking the protocol as the
//   live service actually does (see README): a `: keepalive` comment, named
//   `delta` events, then `data: [DONE]`. The e2e suite runs the real app
//   against it, so every run is deterministic, works offline, and never
//   spends the shared upstream quota.
//
//   A prompt containing BREAK_MIDSTREAM makes it drop the connection after
//   the first fragment — the failure the app must survive without saving.
// ═══════════════════════════════════════════════════════════════════════════
const FRAGMENT_DELAY_MS = 15

function letterFor(prompt: string): string[] {
	const company = /<company>(.*?)<\/company>/.exec(prompt)?.[1] ?? 'Hiring'
	const role = /<job_title>(.*?)<\/job_title>/.exec(prompt)?.[1] ?? 'open'

	return [
		`Dear ${company} Team,`,
		'\n\n',
		`I am writing to express my interest in the ${role} position.`,
		'\n\n',
		'Thank you for considering my application.',
	]
}

const server = createServer((request, response) => {
	if (request.method !== 'POST' || request.url !== '/v1/generate') {
		response.writeHead(404).end()
		return
	}

	if (request.headers.authorization !== `Bearer ${FAKE_GENERATION_API_TOKEN}`) {
		response.writeHead(401, { 'Content-Type': 'application/json' }).end(
			JSON.stringify({
				error: { code: 'invalid_token', message: 'Bad token' },
			}),
		)
		return
	}

	let body = ''

	request.on('data', (chunk) => {
		body += chunk
	})

	request.on('end', async () => {
		const { prompt } = JSON.parse(body) as { prompt: string }
		const fragments = letterFor(prompt)

		response.writeHead(200, { 'Content-Type': 'text/event-stream' })
		response.write(': keepalive\n\n')

		for (const [index, text] of fragments.entries()) {
			response.write(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`)

			await new Promise((resolve) => setTimeout(resolve, FRAGMENT_DELAY_MS))

			if (index === 0 && prompt.includes(BREAK_MIDSTREAM)) {
				response.destroy()
				return
			}
		}

		response.end('data: [DONE]\n\n')
	})
})

server.listen(FAKE_GENERATION_API_PORT, () => {
	console.info(
		`Fake Generation API on http://localhost:${FAKE_GENERATION_API_PORT}`,
	)
})
