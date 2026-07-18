import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Shield } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackButton } from '@/components/ui/BackButton'
import { LEGAL, openPrivacy } from '@/lib/legal'
import { useTranslation } from '@/i18n/context'

type Section = {
  titleKey:
    | 'dataPrivacy.localTitle'
    | 'dataPrivacy.accountTitle'
    | 'dataPrivacy.syncTitle'
    | 'dataPrivacy.deviceOnlyTitle'
    | 'dataPrivacy.noSellTitle'
    | 'dataPrivacy.deleteTitle'
  bodyKey:
    | 'dataPrivacy.localBody'
    | 'dataPrivacy.accountBody'
    | 'dataPrivacy.syncBody'
    | 'dataPrivacy.deviceOnlyBody'
    | 'dataPrivacy.noSellBody'
    | 'dataPrivacy.deleteBody'
}

const SECTIONS: Section[] = [
  { titleKey: 'dataPrivacy.localTitle', bodyKey: 'dataPrivacy.localBody' },
  { titleKey: 'dataPrivacy.accountTitle', bodyKey: 'dataPrivacy.accountBody' },
  { titleKey: 'dataPrivacy.syncTitle', bodyKey: 'dataPrivacy.syncBody' },
  { titleKey: 'dataPrivacy.deviceOnlyTitle', bodyKey: 'dataPrivacy.deviceOnlyBody' },
  { titleKey: 'dataPrivacy.noSellTitle', bodyKey: 'dataPrivacy.noSellBody' },
  { titleKey: 'dataPrivacy.deleteTitle', bodyKey: 'dataPrivacy.deleteBody' },
]

export function DataPrivacyPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 max-w-lg mx-auto w-full"
      >
        <div className="mb-2">
          <BackButton onClick={() => navigate('/settings')} aria-label={t('common.back')} />
        </div>

        <PageHeader
          centered
          title={t('dataPrivacy.title')}
          subtitle={t('dataPrivacy.subtitle')}
        />

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <section
              key={section.titleKey}
              className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]"
            >
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-emerald-400/80 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-1.5">
                    {t(section.titleKey)}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{t(section.bodyKey)}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl divide-y divide-white/[0.06] bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          <button
            type="button"
            onClick={openPrivacy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('dataPrivacy.fullPolicy')}</p>
              <p className="text-xs text-white/30 truncate">{t('dataPrivacy.fullPolicyDesc')}</p>
            </div>
            <ExternalLink size={14} className="text-white/20 shrink-0" />
          </button>
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('dataPrivacy.contact')}</p>
              <p className="text-xs text-white/30 truncate">{LEGAL.supportEmail}</p>
            </div>
            <ExternalLink size={14} className="text-white/20 shrink-0" />
          </a>
        </section>
      </motion.div>
    </AppShell>
  )
}
