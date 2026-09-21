export const BRAND_NAME = 'Alt+Shift'

export const SITE_URL = import.meta.env.PROD
	? 'https://test-production-0cb1.up.railway.app'
	: 'http://localhost:3000'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export function isIndexable(): boolean {
	return import.meta.env.PROD
}

export function pageTitle(title: string): string {
	return `${title} · ${BRAND_NAME}`
}
