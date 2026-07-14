import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Crown, Bell, Shield, HelpCircle, LogOut, ChevronRight, ExternalLink, Trash2, FileText,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LanguageDropdown } from '@/components/LanguagePicker'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { ProPromo } from '@/components/ProPromo'
import { BlockerSetupCard } from '@/components/BlockerSetupCard'
import { Switch } from '@/components/ui/Switch'
import { isNativeBlockingAvailable, isIosBlockingAvailable } from '@/lib/app-blocker'
import {
  isNativeRevenueCatAvailable,
  presentNativeCustomerCenter,
  presentNativePaywall,
} from '@/lib/replock-revenuecat-native'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/Toast'
import { formatMinutes } from '@/lib/utils'
import { openSupport } from '@/lib/legal'
import { isDevToken } from '@/lib/dev-auth'
import { requestPushPermission } from '@/lib/push-notifications'
import { useTranslation } from '@/i18n/context'

export function SettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { profile, screenTimeBalance, totalEarnedMinutes, currentStreak, resetDailyUsage, setLocale, setDifficulty, setNotificationsEnabled } = useStore()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const deleteAccountAction = useAuthStore((s) => s.deleteAccount)
  const [showReset, setShowReset] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleResetDaily = () => {
    resetDailyUsage()
    setShowReset(false)
    toast(t('settings.resetDailySuccess'), 'success')
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) return
    setDeleting(true)
    try {
      await deleteAccountAction(deletePassword)
      toast(t('auth.deleteAccountSuccess'), 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : t('auth.loginFailed'), 'error')
      setDeleting(false)
    }
  }

  const handleSubscriptionPress = () => {
    if (isNativeRevenueCatAvailable()) {
      void (async () => {
        try {
          if (profile.isPro) {
            await presentNativeCustomerCenter()
          } else {
            await presentNativePaywall()
          }
        } catch {
          toast(t('settings.subscriptionNativeFailed'), 'error')
        }
      })()
      return
    }
    navigate('/pricing')
  }

  const handleManageSubscription = () => {
    void (async () => {
      try {
        await presentNativeCustomerCenter()
      } catch {
        toast(t('settings.subscriptionNativeFailed'), 'error')
      }
    })()
  }

  const menuSections = [
    {
      title: t('settings.profile'),
      items: [
        {
          icon: Crown,
          label: t('settings.subscription'),
          value: profile.isPro ? t('common.pro') : t('common.free'),
          action: handleSubscriptionPress,
          badge: profile.isPro ? 'pro' as const : undefined,
        },
        ...(isNativeRevenueCatAvailable()
          ? [
              {
                icon: Crown,
                label: t('settings.manageSubscription'),
                value: t('settings.manageSubscriptionDesc'),
                action: handleManageSubscription,
              },
            ]
          : []),
      ],
    },
    {
      title: t('settings.notifications'),
      items: [],
      showNotifications: true,
    },
    {
      title: t('settings.app'),
      items: [
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
      title: t('settings.legal'),
      items: [
        {
          icon: FileText,
          label: t('settings.privacyPolicy'),
          action: () => navigate('/privacy', { state: { from: '/settings' } }),
        },
        {
          icon: FileText,
          label: t('settings.termsOfService'),
          action: () => navigate('/terms', { state: { from: '/settings' } }),
        },
        {
          icon: HelpCircle,
          label: t('settings.contactSupport'),
          action: openSupport,
          external: true,
        },
      ],
    },
  ]

  const canDeleteAccount = token && !isDevToken(token)

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

        <MotionCard className="p-5 mb-6 gradient-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg truncate">{profile.name}</h2>
                {profile.isPro && <Badge variant="pro">{t('common.pro')}</Badge>}
              </div>
              <p className="text-white/40 text-sm truncate">{user?.email ?? profile.email}</p>
              <p className="text-white/35 text-xs mt-0.5">
                {formatMinutes(screenTimeBalance)} · {currentStreak}{t('common.days')}
              </p>
            </div>
          </div>

          {!profile.isPro && (
            <Button
              variant="outline"
              fullWidth
              className="mt-4 border-indigo-500/25 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/10"
              onClick={() => {
                if (isNativeRevenueCatAvailable()) {
                  void presentNativePaywall().catch(() => {
                    toast(t('settings.subscriptionNativeFailed'), 'error')
                  })
                  return
                }
                navigate('/pricing')
              }}
            >
              <Crown size={16} className="text-indigo-400" />
              <span className="flex-1 text-left">{t('settings.upgradePro')}</span>
              <ChevronRight size={16} className="text-indigo-400/50" />
            </Button>
          )}
        </MotionCard>

        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            {'showLanguage' in section && section.showLanguage ? (
              <MotionCard className="p-4">
                <LanguageDropdown value={profile.locale} onChange={setLocale} />
              </MotionCard>
            ) : 'showNotifications' in section && section.showNotifications ? (
              <MotionCard className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Bell size={18} className="text-white/30 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('settings.notifications')}</p>
                      <p className="text-xs text-white/35 leading-relaxed">
                        {t('settings.notificationsNote')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifications-toggle"
                    checked={profile.notificationsEnabled !== false}
                    onChange={(enabled) => {
                      void (async () => {
                        if (enabled) {
                          const granted = await requestPushPermission()
                          setNotificationsEnabled(granted)
                          toast(
                            granted
                              ? t('settings.notificationsPermissionGranted')
                              : t('settings.notificationsPermissionDenied'),
                            granted ? 'success' : 'info'
                          )
                        } else {
                          setNotificationsEnabled(false)
                          toast(t('settings.notificationsDisabled'), 'info')
                        }
                      })()
                    }}
                  />
                </div>
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
                      {'value' in item && item.value && (
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

        <ProPromo variant="settings" compact />

        <BlockerSetupCard />

        {!isNativeBlockingAvailable() && (
          <MotionCard className="p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-sm font-semibold text-amber-200 mb-2">{t('settings.blockingTitle')}</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-2">{t('settings.blockingCurrent')}</p>
            <p className="text-xs text-white/40 leading-relaxed">{t('settings.blockingNative')}</p>
          </MotionCard>
        )}

        {isIosBlockingAvailable() && (
          <MotionCard className="p-4 mb-6 border border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-sm font-semibold text-indigo-200 mb-2">{t('settings.iosBlockingTitle')}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{t('settings.iosBlockingDesc')}</p>
          </MotionCard>
        )}

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

        {canDeleteAccount && (
          <Button
            variant="danger"
            fullWidth
            className="mb-3"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={16} />
            {t('settings.deleteAccount')}
          </Button>
        )}

        <Button variant="secondary" fullWidth className="mb-6" onClick={logout}>
          <LogOut size={16} />
          {t('auth.signOut')}
        </Button>

        <p className="text-center text-xs text-white/20 pb-4">
          RepLock v1.0.0 · {t('settings.version')}
        </p>
      </motion.div>

      <Modal open={showReset} onClose={() => setShowReset(false)} title={t('settings.resetConfirm')}>
        <p className="text-sm text-white/50 mb-4">{t('settings.resetConfirmDesc')}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowReset(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleResetDaily}>
            {t('exercise.reset')}
          </Button>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => !deleting && setShowDelete(false)} title={t('auth.deleteAccountConfirm')}>
        <p className="text-sm text-white/50 mb-4">{t('auth.deleteAccountWarning')}</p>
        <Input
          id="delete-password"
          type="password"
          label={t('auth.deleteAccountPassword')}
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowDelete(false)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDeleteAccount} disabled={deleting || !deletePassword}>
            {t('auth.deleteAccountSubmit')}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
