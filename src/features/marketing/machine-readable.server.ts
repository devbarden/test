import {
	generateRobotsTxt,
	generateSitemap,
} from '@/lib/seo/robots-and-sitemap'
import { generateLlmsFullText, generateLlmsText } from './llms.server'

const TEXT = 'text/plain; charset=utf-8'

const FILES: Record<string, { body: () => string; contentType: string }> = {
	'/llms-full.txt': { body: generateLlmsFullText, contentType: TEXT },
	'/llms.txt': { body: generateLlmsText, contentType: TEXT },
	'/robots.txt': { body: generateRobotsTxt, contentType: TEXT },
	'/sitemap.xml': {
		body: generateSitemap,
		contentType: 'application/xml; charset=utf-8',
	},
}

export function machineReadableResponse(
	pathname: string,
): Response | undefined {
	const file = FILES[pathname]

	if (!file) return undefined

	return new Response(file.body(), {
		headers: {
			'Cache-Control': 'public, max-age=3600, s-maxage=86400',
			'Content-Type': file.contentType,
		},
	})
}
