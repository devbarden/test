import {
	baseLocale,
	LOCALE_NAMES,
	type Locale,
	locales,
} from '@/lib/i18n/locale'
import { localizedUrl } from '@/lib/seo/seo-links'
import { BRAND_NAME, SITE_URL } from '@/lib/site'
import { m } from '@/paraglide/messages'
import {
	PRODUCT_BENEFITS,
	PRODUCT_FAQ,
	PRODUCT_STEPS,
} from './model/product-content'

// ═══════════════════════════════════════════════════════════════════════════
//   /llms.txt is the short index an AI system reads first: what the product
//   is, how it works, where the pages are. /llms-full.txt is the whole
//   public site as one markdown document, once per language.
//
//   Both are rendered from the same messages the landing renders from, so
//   they cannot drift from what visitors see — a hand-written file in
//   public/ goes on describing a product that has since changed. Every
//   message is read with an explicit locale: the documents are built once
//   per process, from whichever request arrives first, and the ambient
//   locale would freeze that visitor's language into every crawler's copy.
// ═══════════════════════════════════════════════════════════════════════════
const EN = { locale: baseLocale }

function stepsList(options: { locale: Locale }): string {
	return PRODUCT_STEPS.map(
		(step, index) =>
			`${index + 1}. **${step.title(options)}** — ${step.body(options)}`,
	).join('\n')
}

function featuresList(options: { locale: Locale }): string {
	return PRODUCT_BENEFITS.map(
		(feature) => `- **${feature.title(options)}** — ${feature.body(options)}`,
	).join('\n')
}

function faqList(options: { locale: Locale }): string {
	return PRODUCT_FAQ.map(
		(entry) => `### ${entry.question(options)}\n\n${entry.answer(options)}`,
	).join('\n\n')
}

function buildLlmsText(): string {
	const languages = locales
		.map((locale) => `${LOCALE_NAMES[locale]}: ${localizedUrl('/', locale)}`)
		.join(', ')

	return `# ${BRAND_NAME}

> ${BRAND_NAME} (${SITE_URL}) is an AI cover letter generator. ${m['landing.hero.lead']({}, EN)}

${m['meta.landing.description']({}, EN)}

## How it works

${stepsList(EN)}

## Why ${BRAND_NAME}

${featuresList(EN)}

## FAQ

${faqList(EN)}

## Languages

The interface is available in ${locales.length} languages, each at a URL of its own — ${languages}. Letters are written in the language the applicant uses for the job details.

## Pages

- [Home](${localizedUrl('/', baseLocale)}): what ${BRAND_NAME} does, how it works, FAQ
- [Sign in](${SITE_URL}/sign-in): the app itself — the editor and the saved letters — sits behind sign-in and is not indexed

## Full content

- [llms-full.txt](${SITE_URL}/llms-full.txt): every public page in one markdown document, in every language
`
}

function landingSection(locale: Locale): string {
	const options = { locale }

	return `# ${m['landing.hero.title']({}, options)}

URL: ${localizedUrl('/', locale)}
Language: ${LOCALE_NAMES[locale]}

${m['landing.hero.lead']({}, options)}

${m['landing.hero.note']({}, options)}

## ${m['landing.steps.title']({}, options)}

${m['landing.steps.lead']({}, options)}

${stepsList(options)}

## ${m['landing.features.title']({}, options)}

${featuresList(options)}

## ${m['landing.faq.title']({}, options)}

${faqList(options)}`
}

function buildLlmsFullText(): string {
	return [
		`# ${BRAND_NAME} — full public content\n\nSource: ${SITE_URL}\nEvery section below is one public page, once per language.`,
		...locales.map(landingSection),
	].join('\n\n---\n\n')
}

let cachedLlmsText: string | undefined
let cachedLlmsFullText: string | undefined

export function generateLlmsText(): string {
	cachedLlmsText ??= buildLlmsText()
	return cachedLlmsText
}

export function generateLlmsFullText(): string {
	cachedLlmsFullText ??= `${buildLlmsFullText()}\n`
	return cachedLlmsFullText
}
