import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useStore } from '@/store'
import { translate, type Locale } from '@/i18n'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useStore((s) => s.profile.locale)
  const setLocale = useStore((s) => s.setLocale)

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}

export function useExerciseName(type: string) {
  const { t } = useTranslation()
  return {
    name: t(`exercises.${type}.name`),
    description: t(`exercises.${type}.description`),
  }
}
