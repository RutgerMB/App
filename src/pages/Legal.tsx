import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { useAuthStore } from '@/store/auth'

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
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
    <div className="min-h-dvh bg-surface-0 noise px-6 py-8 safe-top safe-bottom overflow-y-auto">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-white/65 text-sm leading-relaxed">
        {children}
      </div>
      <p className="text-xs text-white/25 mt-10">Last updated: July 2026</p>
    </div>
  )
}

export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <LegalShell title={t('legal.privacyTitle')}>
      <p>{t('legal.privacyIntro')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.dataWeCollect')}</h2>
      <p>{t('legal.dataWeCollectBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.howWeUse')}</h2>
      <p>{t('legal.howWeUseBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.dataStorage')}</h2>
      <p>{t('legal.dataStorageBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.yourRights')}</h2>
      <p>{t('legal.yourRightsBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.contact')}</h2>
      <p>{t('legal.contactBody')}</p>
    </LegalShell>
  )
}

export function TermsPage() {
  const { t } = useTranslation()

  return (
    <LegalShell title={t('legal.termsTitle')}>
      <p>{t('legal.termsIntro')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.subscriptions')}</h2>
      <p>{t('legal.subscriptionsBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.acceptableUse')}</h2>
      <p>{t('legal.acceptableUseBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.disclaimer')}</h2>
      <p>{t('legal.disclaimerBody')}</p>
      <h2 className="text-base font-semibold text-white/85 pt-2">{t('legal.termination')}</h2>
      <p>{t('legal.terminationBody')}</p>
    </LegalShell>
  )
}
