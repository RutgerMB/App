import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User, Crown, Bell, Shield, HelpCircle, LogOut, ChevronRight, ExternalLink,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LanguageDropdown } from '@/components/LanguagePicker'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { ProPromo } from '@/components/ProPromo'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/Toast'
import { formatMinutes } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

export function SettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { profile, screenTimeBalance, totalEarnedMinutes, currentStreak, resetDailyUsage, setLocale, setDifficulty } = useStore()
  const [showReset, setShowReset] = useState(false)

  const handleResetDaily = () => {
    resetDailyUsage()
    setShowReset(false)
    toast(t('settings.resetDailyDesc'), 'info')
  }

  const menuSections = [
    {
      title: t('settings.profile'),
      items: [
        {
          icon: User,
          label: t('settings.profile'),
          value: profile.name,
          action: () => {},
        },
        {
          icon: Crown,
          label: t('settings.subscription'),
          value: profile.isPro ? t('common.pro') : t('common.free'),
          action: () => navigate('/pricing'),
          badge: profile.isPro ? 'pro' as const : undefined,
        },
      ],
    },
    {
      title: t('settings.notifications'),
      items: [
        {
          icon: Bell,
          label: t('settings.notifications'),
          value: t('settings.notificationsEnabled'),
          action: () => toast(t('settings.notificationsEnabled'), 'info'),
        },
        {
          icon: Shield,
          label: t('settings.resetDaily'),
          value: t('settings.resetDailyDesc'),
          action: () => setShowReset(true),
        },
      ],
    },
    {
      title: t('settings.language'),
      items: [],
      showLanguage: true,
    },
    {
      title: t('settings.difficulty'),
      items: [],
      showDifficulty: true,
    },
    {
      title: t('settings.help'),
      items: [
        {
          icon: HelpCircle,
          label: t('settings.help'),
          action: () => window.open('https://stripe.com/docs/testing', '_blank'),
          external: true,
        },
      ],
    },
  ]

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        </div>

        <ProPromo variant="settings" compact />

        {/* Profile Card */}
        <MotionCard className="p-5 mb-6 gradient-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{profile.name}</h2>
                {profile.isPro && <Badge variant="pro">{t('common.pro')}</Badge>}
              </div>
              <p className="text-white/40 text-sm">
                {formatMinutes(screenTimeBalance)} · {currentStreak}{t('common.days')}
              </p>
            </div>
          </div>

          {!profile.isPro && (
            <button
              onClick={() => navigate('/pricing')}
              className="mt-4 w-full p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-between hover:bg-indigo-500/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">{t('settings.upgradePro')}</span>
              </div>
              <ChevronRight size={16} className="text-indigo-400/50" />
            </button>
          )}
        </MotionCard>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            {'showLanguage' in section && section.showLanguage ? (
              <MotionCard className="p-4">
                <LanguageDropdown value={profile.locale} onChange={setLocale} />
              </MotionCard>
            ) : 'showDifficulty' in section && section.showDifficulty ? (
              <DifficultyPicker
                value={profile.difficulty ?? 'medium'}
                onChange={(d) => {
                  setDifficulty(d)
                  toast(t('settings.difficultyUpdated'), 'info')
                }}
                compact
              />
            ) : (
              <MotionCard className="divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <item.icon size={18} className="text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.value && (
                        <p className="text-xs text-white/30 truncate">{item.value}</p>
                      )}
                    </div>
                    {'badge' in item && item.badge && <Badge variant={item.badge}>{t('common.pro')}</Badge>}
                    {'external' in item && item.external ? (
                      <ExternalLink size={14} className="text-white/20" />
                    ) : (
                      <ChevronRight size={14} className="text-white/20" />
                    )}
                  </button>
                ))}
              </MotionCard>
            )}
          </div>
        ))}

        {/* Blocking info */}
        <MotionCard className="p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
          <h3 className="text-sm font-semibold text-amber-200 mb-2">{t('settings.blockingTitle')}</h3>
          <p className="text-xs text-white/50 leading-relaxed mb-2">{t('settings.blockingCurrent')}</p>
          <p className="text-xs text-white/40 leading-relaxed">{t('settings.blockingNative')}</p>
        </MotionCard>

        {/* Stats */}
        <MotionCard className="p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/30">{t('settings.lifetimeEarned')}</p>
              <p className="font-semibold text-lg">{formatMinutes(totalEarnedMinutes)}</p>
            </div>
            <div>
              <p className="text-white/30">{t('settings.memberSince')}</p>
              <p className="font-semibold text-lg">
                {new Date(profile.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </MotionCard>

        <p className="text-center text-xs text-white/20 pb-4">
          RepLock v1.0.0 · {t('settings.version')}
        </p>
      </motion.div>

      <Modal open={showReset} onClose={() => setShowReset(false)} title={t('settings.resetConfirm')}>
        <p className="text-sm text-white/50 mb-4">
          {t('settings.resetConfirmDesc')}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowReset(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleResetDaily}>
            <LogOut size={14} />
            {t('exercise.reset')}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
