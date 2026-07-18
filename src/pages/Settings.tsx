import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Crown, Bell, Shield, HelpCircle, LogOut, ChevronRight, ExternalLink, Trash2, FileText, KeyRound, UserPen, Lock,
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
import { useStore, MAX_DISPLAY_NAME_LENGTH } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/Toast'
import { formatMinutes, cn } from '@/lib/utils'
import { openSupport } from '@/lib/legal'
import { isDevToken } from '@/lib/dev-auth'
import {
  checkNotificationPermission,
  openNotificationSettings,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '@/lib/push-notifications'
import {
  disableAndClearReminders,
  syncLocalReminders,
} from '@/lib/planned-notifications'
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
  const changePasswordAction = useAuthStore((s) => s.changePassword)
  const updateDisplayNameAction = useAuthStore((s) => s.updateDisplayName)
  const canChangePassword = useAuthStore((s) => s.canChangePassword)
  const [showReset, setShowReset] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeName, setShowChangeName] = useState(false)
  const [changeNameStep, setChangeNameStep] = useState<'edit' | 'confirm'>('edit')
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [osPermission, setOsPermission] = useState<NotificationPermissionStatus | null>(null)

  const refreshOsPermission = async () => {
    const status = await checkNotificationPermission()
    setOsPermission(status)
    return status
  }

  useEffect(() => {
    void refreshOsPermission()
  }, [])

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false)
      await disableAndClearReminders()
      toast(t('settings.notificationsDisabled'), 'info')
      return
    }

    let status = await refreshOsPermission()
    if (status === 'denied') {
      setNotificationsEnabled(false)
      toast(t('settings.notificationsPermissionDenied'), 'info')
      await openNotificationSettings()
      return
    }

    if (status === 'prompt') {
      const granted = await requestNotificationPermission()
      status = await refreshOsPermission()
      if (!granted) {
        setNotificationsEnabled(false)
        toast(t('settings.notificationsPermissionDenied'), 'info')
        if (status === 'denied') await openNotificationSettings()
        return
      }
    }

    setNotificationsEnabled(true)
    const state = useStore.getState()
    await syncLocalReminders({
      profile: { ...state.profile, notificationsEnabled: true },
      currentStreak: state.currentStreak,
      lastExerciseDate: state.lastExerciseDate,
      screenTimeBalance: state.screenTimeBalance,
      locale: state.profile.locale ?? 'en',
    })
    toast(t('settings.notificationsPermissionGranted'), 'success')
  }

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

  const resetChangePasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const openChangeName = () => {
    setDisplayNameDraft(profile.name)
    setChangeNameStep('edit')
    setShowChangeName(true)
  }

  const closeChangeName = () => {
    if (savingName) return
    setShowChangeName(false)
    setChangeNameStep('edit')
    setDisplayNameDraft('')
  }

  const handleChangeNameContinue = () => {
    const trimmed = displayNameDraft.trim()
    if (!trimmed) {
      toast(t('settings.displayNameRequired'), 'error')
      return
    }
    if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
      toast(t('settings.displayNameTooLong'), 'error')
      return
    }
    if (trimmed === profile.name.trim()) {
      toast(t('settings.displayNameUnchanged'), 'info')
      return
    }
    setDisplayNameDraft(trimmed)
    setChangeNameStep('confirm')
  }

  const handleChangeNameConfirm = async () => {
    const trimmed = displayNameDraft.trim()
    if (!trimmed) return
    setSavingName(true)
    try {
      await updateDisplayNameAction(trimmed)
      toast(t('settings.displayNameSuccess'), 'success')
      setShowChangeName(false)
      setChangeNameStep('edit')
      setDisplayNameDraft('')
    } catch (err) {
      toast(err instanceof Error ? err.message : t('settings.displayNameFailed'), 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) return
    if (newPassword !== confirmPassword) {
      toast(t('auth.passwordMismatch'), 'error')
      return
    }
    if (newPassword.length < 8) {
      toast(t('auth.passwordTooShort'), 'error')
      return
    }
    setChangingPassword(true)
    try {
      await changePasswordAction(currentPassword, newPassword)
      toast(t('settings.changePasswordSuccess'), 'success')
      setShowChangePassword(false)
      resetChangePasswordForm()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('settings.changePasswordFailed'), 'error')
    } finally {
      setChangingPassword(false)
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
          icon: Lock,
          label: t('settings.dataPrivacy'),
          value: t('settings.dataPrivacyDesc'),
          action: () => navigate('/settings/data-privacy'),
        },
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
  const showChangePasswordButton = canChangePassword()

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/25">
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
                className="mt-5 border-emerald-500/25 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => {
                  void openUpgradeOrFallback(() => navigate('/pricing'))
                }}
              >
                <Crown size={16} className="text-emerald-400" />
                <span className="flex-1 text-left">{t('settings.upgradePro')}</span>
                <ChevronRight size={16} className="text-emerald-400/50" />
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
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07] space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Bell size={18} className="text-white/30 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('settings.notifications')}</p>
                      <p className="text-xs text-white/35 leading-relaxed">
                        {osPermission === 'denied'
                          ? t('settings.notificationsDeniedNote')
                          : t('settings.notificationsNote')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifications-toggle"
                    checked={
                      profile.notificationsEnabled !== false && osPermission !== 'denied'
                    }
                    onChange={(enabled) => {
                      void handleNotificationsToggle(enabled)
                    }}
                  />
                </div>
                {osPermission === 'denied' && (
                  <button
                    type="button"
                    onClick={() => {
                      void openNotificationSettings()
                    }}
                    className="w-full h-10 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
                  >
                    {t('settings.notificationsOpenSettings')}
                  </button>
                )}
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
          <div className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-semibold text-emerald-200 mb-2">
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

        <div className="space-y-3">
          <Button
            variant="secondary"
            fullWidth
            className="border-white/10 bg-white/[0.04]"
            onClick={openChangeName}
          >
            <UserPen size={16} />
            {t('settings.changeDisplayName')}
          </Button>

          {showChangePasswordButton && (
            <Button
              variant="secondary"
              fullWidth
              className="border-white/10 bg-white/[0.04]"
              onClick={() => setShowChangePassword(true)}
            >
              <KeyRound size={16} />
              {t('settings.changePassword')}
            </Button>
          )}

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
        </div>

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
        <div className="space-y-3 mb-4 text-sm text-white/50 leading-relaxed">
          <p>{t('auth.deleteAccountWarning')}</p>
          <p>{t('auth.deleteAccountDetails')}</p>
          <p>{t('auth.deleteAccountHelp')}</p>
        </div>
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

      <Modal
        open={showChangeName}
        onClose={closeChangeName}
        title={
          changeNameStep === 'edit'
            ? t('settings.changeDisplayName')
            : t('settings.displayNameConfirmTitle')
        }
      >
        {changeNameStep === 'edit' ? (
          <>
            <p className="text-sm text-white/50 mb-4">{t('settings.changeDisplayNameDesc')}</p>
            <Input
              id="display-name"
              label={t('settings.displayName')}
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value.slice(0, MAX_DISPLAY_NAME_LENGTH))}
              autoComplete="name"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeChangeName}>
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangeNameContinue}
                disabled={!displayNameDraft.trim()}
              >
                {t('common.continue')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-white/50 mb-4">
              {t('settings.displayNameConfirmDesc', { name: displayNameDraft.trim() })}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setChangeNameStep('edit')}
                disabled={savingName}
              >
                {t('common.back')}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  void handleChangeNameConfirm()
                }}
                disabled={savingName}
              >
                {t('settings.displayNameConfirm')}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={showChangePassword}
        onClose={() => {
          if (changingPassword) return
          setShowChangePassword(false)
          resetChangePasswordForm()
        }}
        title={t('settings.changePassword')}
      >
        <p className="text-sm text-white/50 mb-4">{t('settings.changePasswordDesc')}</p>
        <div className="space-y-3 mb-4">
          <Input
            id="current-password"
            type="password"
            label={t('settings.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            id="new-password"
            type="password"
            label={t('settings.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            id="confirm-new-password"
            type="password"
            label={t('settings.confirmNewPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setShowChangePassword(false)
              resetChangePasswordForm()
            }}
            disabled={changingPassword}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !currentPassword.trim() ||
              !newPassword.trim() ||
              !confirmPassword.trim()
            }
          >
            {t('settings.changePasswordSubmit')}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
