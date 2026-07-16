import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Crown, Bell, Shield, HelpCircle, LogOut, ChevronRight, ExternalLink, Trash2, FileText,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, SectionLabel } from '@/components/layout/PageHeader'
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
  openManageSubscription,
  openUpgradeOrFallback,
} from '@/lib/replock-revenuecat-native'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/Toast'
import { formatMinutes, cn } from '@/lib/utils'
import { openSupport } from '@/lib/legal'
import { isDevToken } from '@/lib/dev-auth'
import { requestPushPermission } from '@/lib/push-notifications'
import { useTranslation } from '@/i18n/context'

export function SettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const {
    profile,
    screenTimeBalance,
    totalEarnedMinutes,
    currentStreak,
    resetDailyUsage,
    setLocale,
    setDifficulty,
    setNotificationsEnabled,
  } = useStore()
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
    if (profile.isPro) {
      if (isNativeRevenueCatAvailable()) {
        void handleManageSubscription()
        return
      }
      toast(t('pricing.onPro'), 'info')
      return
    }
    void openUpgradeOrFallback(() => navigate('/pricing'))
  }

  const handleManageSubscription = async () => {
    try {
      const result = await openManageSubscription({ restoreIfNeeded: !profile.isPro })
      if (result.restored) {
        toast(t('pricing.restored'), 'success')
        return
      }
      if (!result.opened) {
        toast(t('settings.subscriptionNativeFailed'), 'error')
        if (!profile.isPro) {
          void openUpgradeOrFallback(() => navigate('/pricing'))
        }
      }
    } catch {
      toast(t('settings.subscriptionNativeFailed'), 'error')
      if (!profile.isPro) {
        void openUpgradeOrFallback(() => navigate('/pricing'))
      }
    }
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
          badge: profile.isPro ? ('pro' as const) : undefined,
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 max-w-lg mx-auto w-full"
      >
        <PageHeader centered title={t('settings.title')} subtitle={t('settings.subtitle')} />

        <section>
          <div
            className={cn(
              'rounded-2xl px-5 py-5 text-center',
              'bg-white/[0.03] border border-white/[0.07]'
            )}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/25">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center justify-center gap-2 min-w-0">
              <h2 className="font-semibold text-lg tracking-tight truncate max-w-[14rem]">
                {profile.name}
              </h2>
              {profile.isPro && <Badge variant="pro">{t('common.pro')}</Badge>}
            </div>
            <p className="text-white/40 text-sm mt-1 truncate px-2">
              {user?.email ?? profile.email}
            </p>
            <p className="text-white/35 text-xs mt-1.5 tabular-nums">
              {formatMinutes(screenTimeBalance)} · {currentStreak}
              {t('common.days')}
            </p>

            {!profile.isPro && (
              <Button
                variant="outline"
                fullWidth
                className="mt-5 border-indigo-500/25 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => {
                  void openUpgradeOrFallback(() => navigate('/pricing'))
                }}
              >
                <Crown size={16} className="text-indigo-400" />
                <span className="flex-1 text-left">{t('settings.upgradePro')}</span>
                <ChevronRight size={16} className="text-indigo-400/50" />
              </Button>
            )}
          </div>
        </section>

        {menuSections.map((section) => (
          <section key={section.title}>
            <SectionLabel>{section.title}</SectionLabel>
            {'showLanguage' in section && section.showLanguage ? (
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
                <LanguageDropdown value={profile.locale} onChange={setLocale} />
              </div>
            ) : 'showNotifications' in section && section.showNotifications ? (
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
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
              </div>
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
              <div className="rounded-2xl divide-y divide-white/[0.06] bg-white/[0.03] border border-white/[0.07] overflow-hidden">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <item.icon size={18} className="text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      {'value' in item && item.value && (
                        <p className="text-xs text-white/30 truncate">{item.value}</p>
                      )}
                    </div>
                    {'badge' in item && item.badge && (
                      <Badge variant={item.badge}>{t('common.pro')}</Badge>
                    )}
                    {'external' in item && item.external ? (
                      <ExternalLink size={14} className="text-white/20" />
                    ) : (
                      <ChevronRight size={14} className="text-white/20" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}

        <div className="pt-1">
          <ProPromo variant="settings" compact />
        </div>

        <BlockerSetupCard />

        {!isNativeBlockingAvailable() && (
          <div className="rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-sm font-semibold text-amber-200 mb-2">
              {t('settings.blockingTitle')}
            </h3>
            <p className="text-xs text-white/50 leading-relaxed mb-2">
              {t('settings.blockingCurrent')}
            </p>
            <p className="text-xs text-white/40 leading-relaxed">{t('settings.blockingNative')}</p>
          </div>
        )}

        {isIosBlockingAvailable() && (
          <div className="rounded-2xl p-4 border border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-sm font-semibold text-indigo-200 mb-2">
              {t('settings.iosBlockingTitle')}
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">{t('settings.iosBlockingDesc')}</p>
          </div>
        )}

        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
          <div className="grid grid-cols-2 gap-4 text-sm text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/30">
                {t('settings.lifetimeEarned')}
              </p>
              <p className="font-semibold text-lg mt-1 tabular-nums">
                {formatMinutes(totalEarnedMinutes)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/30">
                {t('settings.memberSince')}
              </p>
              <p className="font-semibold text-lg mt-1">
                {new Date(profile.createdAt).toLocaleDateString([], {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {canDeleteAccount && (
          <Button variant="danger" fullWidth onClick={() => setShowDelete(true)}>
            <Trash2 size={16} />
            {t('settings.deleteAccount')}
          </Button>
        )}

        <Button variant="secondary" fullWidth className="border-white/10 bg-white/[0.04]" onClick={logout}>
          <LogOut size={16} />
          {t('auth.signOut')}
        </Button>

        <p className="text-center text-xs text-white/20 pb-2">
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

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        title={t('auth.deleteAccountConfirm')}
      >
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
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowDelete(false)}
            disabled={deleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDeleteAccount}
            disabled={deleting || !deletePassword}
          >
            {t('auth.deleteAccountSubmit')}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
