import {
	PRODUCT_FAQ,
	PRODUCT_STEPS,
} from '@/features/marketing/model/product-content'
import { getLocaleSnapshot } from '@/lib/i18n/locale'
import {
	alternateLinks,
	currentUrl,
	jsonLdScripts,
	socialMeta,
} from '@/lib/seo/seo-links'
import { BRAND_NAME, DEFAULT_OG_IMAGE, pageTitle, SITE_URL } from '@/lib/site'
import { m } from '@/paraglide/messages'

const PATH = '/'

// ═══════════════════════════════════════════════════════════════════════════
//   Structured data is built per request from the translated messages: it
//   must describe the page in the language the page is in.
//
//   `Service`, not `SoftwareApplication`: Google treats the latter as a
//   rich-result type that requires ratings, and without real ones it sits
//   in Search Console as permanently invalid. `Service` is never validated
//   and is still read by AI answer engines. HowTo and FAQPage no longer earn
//   rich results either, but an ineligible type is not an error, and they
//   are exactly what an assistant quotes when asked how the product works.
// ═══════════════════════════════════════════════════════════════════════════
function organizationSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		description: m['meta.root.description'](),
		logo: `${SITE_URL}/icon-512.png`,
		name: BRAND_NAME,
		url: SITE_URL,
	}
}

function webSiteSchema(url: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		inLanguage: getLocaleSnapshot(),
		name: BRAND_NAME,
		url,
	}
}

function serviceSchema(url: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		description: m['meta.landing.description'](),
		image: DEFAULT_OG_IMAGE,
		name: BRAND_NAME,
		provider: { '@type': 'Organization', name: BRAND_NAME, url: SITE_URL },
		serviceType: m['meta.serviceType'](),
		url,
	}
}

function howToSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		description: m['landing.steps.lead'](),
		name: m['landing.steps.title'](),
		step: PRODUCT_STEPS.map((step, index) => ({
			'@type': 'HowToStep',
			name: step.title(),
			position: index + 1,
			text: step.body(),
		})),
	}
}

function faqSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: PRODUCT_FAQ.map((entry) => ({
			'@type': 'Question',
			acceptedAnswer: { '@type': 'Answer', text: entry.answer() },
			name: entry.question(),
		})),
	}
}

export function landingHead() {
	const url = currentUrl(PATH)
	const title = pageTitle(m['meta.landing.title']())
	const description = m['meta.landing.description']()

	return {
		links: [{ href: url, rel: 'canonical' }, ...alternateLinks(PATH)],
		meta: [{ title }, ...socialMeta(title, description, url)],
		scripts: jsonLdScripts([
			organizationSchema(),
			webSiteSchema(url),
			serviceSchema(url),
			howToSchema(),
			faqSchema(),
		]),
	}
}
