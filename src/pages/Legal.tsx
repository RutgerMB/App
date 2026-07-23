import { useNavigate, useLocation } from 'react-router-dom'
import { BackButton } from '@/components/ui/BackButton'
import { useTranslation } from '@/i18n/context'
import { useAuthStore } from '@/store/auth'
import { getLegalDocument } from '@/content/legal'

function LegalShell({ title, children, lastUpdated }: { title: string; children: React.ReactNode; lastUpdated: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const from = (location.state as { from?: string } | null)?.from

  const handleBack = () => {
    if (from) {
      navigate(from)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(token ? '/settings' : '/login')
  }

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] bg-surface-0 noise px-6 py-8 safe-top safe-bottom overflow-y-scroll overscroll-contain max-w-lg mx-auto"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      <div className="mb-6">
        <BackButton onClick={handleBack} aria-label={t('common.back')} />
      </div>
      <h1 className="text-2xl font-bold mb-6 tracking-tight">{title}</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-white/65 text-sm leading-relaxed">
        {children}
      </div>
      <p className="text-xs text-white/25 mt-10">
        {t('legal.lastUpdated')}: {lastUpdated}
      </p>
    </div>
  )
}

function LegalSections({ sections }: { sections: { title: string; paragraphs: string[] }[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-base font-semibold text-white/85 pt-2">{section.title}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      ))}
    </>
  )
}

export function PrivacyPage() {
  const { t, locale } = useTranslation()
  const doc = getLegalDocument(locale)

  return (
    <LegalShell title={t('legal.privacyTitle')} lastUpdated={doc.lastUpdated}>
      <p>{doc.privacyIntro}</p>
      <LegalSections sections={doc.privacySections} />
    </LegalShell>
  )
}

export function TermsPage() {
  const { t, locale } = useTranslation()
  const doc = getLegalDocument(locale)

  return (
    <LegalShell title={t('legal.termsTitle')} lastUpdated={doc.lastUpdated}>
      <p>{doc.termsIntro}</p>
      <LegalSections sections={doc.termsSections} />
    </LegalShell>
  )
}
