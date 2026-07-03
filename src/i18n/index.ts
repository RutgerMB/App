import type { Locale, Translations } from './types'
import { en } from './locales/en'
import { nl } from './locales/nl'
import { de } from './locales/de'
import { fr } from './locales/fr'
import { es } from './locales/es'

export const dictionaries: Record<Locale, Translations> = { en, nl, de, fr, es }

export type { Locale, Translations }
export { LOCALES } from './types'

export function detectLocale(): Locale {
  const lang = navigator.language.split('-')[0]
  if (lang in dictionaries) return lang as Locale
  return 'en'
}

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const text =
    getByPath(dictionaries[locale], key) ??
    getByPath(dictionaries.en, key) ??
    key
  if (!params) return text
  let result = text
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, String(v))
  }
  return result
}
