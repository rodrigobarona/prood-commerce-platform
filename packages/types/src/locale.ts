// ---------------------------------------------------------------------------
// Locale constants — default supported languages for the platform
// ---------------------------------------------------------------------------

export const DEFAULT_LOCALE = 'en' as const

export const DEFAULT_LOCALES = ['en', 'pt', 'es'] as const

export type SupportedLocale = (typeof DEFAULT_LOCALES)[number]

export const LOCALE_META: Record<string, { name: string; direction: 'ltr' | 'rtl' }> = {
  en: { name: 'English', direction: 'ltr' },
  pt: { name: 'Português', direction: 'ltr' },
  es: { name: 'Español', direction: 'ltr' },
}
