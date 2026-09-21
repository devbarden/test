import { CheckIcon, ChevronDownIcon, GlobeIcon } from 'lucide-react'
import {
	type FocusEvent,
	type MouseEvent,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'
import { IconButton } from '@/components/ui/icon-button'
import { usePathname } from '@/hooks/use-pathname'
import {
	changeLocale,
	LOCALE_NAMES,
	type Locale,
	locales,
} from '@/lib/i18n/locale'
import { isLocalizablePath } from '@/lib/i18n/localized-routes'
import { useLocale } from '@/lib/i18n/use-locale'
import { m } from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'
import styles from './language-switcher.module.css'

type LanguageSwitcherProps = {
	compact?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   A globe that opens the list of languages, each named in itself — a
//   picker is read by someone who may not read the current language yet.
//   `compact` is the icon alone, sized like the header's other icon
//   buttons.
//
//   A disclosure, not an ARIA menu: a short list of links and buttons that
//   Tab moves through, closed by Escape, a click outside or focus leaving
//   it. On a public page each option is a real link to that page's
//   translation, so it can be crawled and opened in a new tab (a modified
//   click is left to the browser); inside the app the language lives in a
//   cookie, so the options are buttons. Either way the switch reloads the
//   page: copy is rendered once per locale and memoized.
// ═══════════════════════════════════════════════════════════════════════════
export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
	const current = useLocale()
	const pathname = usePathname()
	const linked = isLocalizablePath(pathname)
	const [isOpen, setIsOpen] = useState(false)
	const root = useRef<HTMLDivElement>(null)
	const listId = useId()

	useEffect(() => {
		if (!isOpen) return

		const closeOnOutside = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) setIsOpen(false)
		}
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsOpen(false)
		}

		document.addEventListener('pointerdown', closeOnOutside)
		document.addEventListener('keydown', closeOnEscape)

		return () => {
			document.removeEventListener('pointerdown', closeOnOutside)
			document.removeEventListener('keydown', closeOnEscape)
		}
	}, [isOpen])

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
	}

	const choose = (locale: Locale) => (event: MouseEvent) => {
		const isModified =
			event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

		if (linked && (isModified || event.button !== 0)) return

		event.preventDefault()
		setIsOpen(false)
		changeLocale(locale)
	}

	const option = (locale: Locale) => {
		const content = (
			<>
				<span>{LOCALE_NAMES[locale]}</span>
				{locale === current && <CheckIcon className={styles.check} />}
			</>
		)
		const props = {
			'aria-current': locale === current ? ('true' as const) : undefined,
			className: styles.option,
			lang: locale,
			onClick: choose(locale),
		}

		return linked ? (
			<a {...props} href={localizeHref(pathname, { locale })} hrefLang={locale}>
				{content}
			</a>
		) : (
			<button {...props} type="button">
				{content}
			</button>
		)
	}

	const label = m['common.languageSwitcher.label']()
	const toggle = () => setIsOpen((open) => !open)

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: blur only closes the list when focus leaves it; the controls inside are the real buttons and links
		<div className={styles.switcher} onBlur={handleBlur} ref={root}>
			{compact ? (
				<IconButton
					aria-controls={listId}
					aria-expanded={isOpen}
					icon={<GlobeIcon />}
					label={label}
					onClick={toggle}
				/>
			) : (
				<button
					aria-controls={listId}
					aria-expanded={isOpen}
					aria-label={label}
					className={styles.trigger}
					onClick={toggle}
					title={label}
					type="button"
				>
					<GlobeIcon className={styles.globe} />
					<span lang={current}>{LOCALE_NAMES[current]}</span>
					<ChevronDownIcon className={styles.chevron} />
				</button>
			)}
			<ul className={styles.list} hidden={!isOpen} id={listId}>
				{locales.map((locale) => (
					<li key={locale}>{option(locale)}</li>
				))}
			</ul>
		</div>
	)
}
