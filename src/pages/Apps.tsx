import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Unlock, Clock, Grid3X3, Pencil, Eye } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button, MotionButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { DeviceAppPicker } from '@/components/DeviceAppPicker'
import { useStore } from '@/store'
import { FREE_APP_LIMIT, DEFAULT_DAILY_OPENINGS } from '@/types'
import { localDateString } from '@/lib/dates'
import { getAppLimitLabel, getTrialStatus } from '@/lib/trial'
import { formatMinutes, formatTimeRemaining, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { TrialBanner } from '@/components/TrialBanner'
import { BlockerSetupCard } from '@/components/BlockerSetupCard'
import { AppsHubRow } from '@/components/apps/AppsHubCards'
import { useTranslation } from '@/i18n/context'
import { canPickInstalledApps, usesIosActivityPicker } from '@/lib/device-apps'
import { presentIosSelectedAppsSheet } from '@/lib/replock-controls'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'

export function AppsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const {
    apps,
    profile,
    screenTimeBalance,
    unlockApp,
    addApp,
    removeApp,
    updateAppLimit,
    renameApp,
  } = useStore()
  const trialStatus = getTrialStatus(profile)
  const canEditLimits = profile.isPro || trialStatus === 'trial'
  const appLimitLabel = getAppLimitLabel(profile)
  const onIos = usesIosActivityPicker()
  const canAddApps = canPickInstalledApps() || onIos

  const [showPicker, setShowPicker] = useState(false)
  const [pendingApp, setPendingApp] = useState<DeviceAppDefinition | null>(null)
  const [dailyLimit, setDailyLimit] = useState(30)
  const [pendingName, setPendingName] = useState('')
  const [showUnlock, setShowUnlock] = useState<string | null>(null)
  const [unlockMinutes, setUnlockMinutes] = useState(15)
  const [unlockCustomInput, setUnlockCustomInput] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [editLimitApp, setEditLimitApp] = useState<string | null>(null)
  const [editLimitValue, setEditLimitValue] = useState(30)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [nativeSheetLoading, setNativeSheetLoading] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  // Pull nicknames from native App Group so Home/Apps never stay on "App 1".
  useEffect(() => {
    if (!onIos) return
    let cancelled = false
    void (async () => {
      try {
        const { getIosSelectedApps } = await import('@/lib/replock-controls')
        const rows = await getIosSelectedApps()
        if (cancelled) return
        for (const row of rows) {
          if (!row.hasCustomName) continue
          const match = apps.find((a) => a.iosTokenId === row.id)
          if (match && match.name !== row.name) {
            renameApp(match.id, row.name)
          }
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
    // Only on mount / when ios token set changes size — avoid rename loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onIos, apps.length])

  const existingIds = apps.flatMap((a) => [
    a.brand ?? '',
    a.packageName ?? '',
    a.iosTokenId ?? '',
    a.name.toLowerCase(),
  ])

  const availableBalance = Math.max(0, Math.floor(screenTimeBalance))

  const selectUnlockPreset = (mins: number) => {
    setUnlockCustomInput('')
    setUnlockError(null)
    setUnlockMinutes(mins)
  }

  const applyCustomUnlockInput = (raw: string) => {
    // Digits only — no decimals, commas, or signs
    const cleaned = raw.replace(/[^\d]/g, '')
    setUnlockCustomInput(cleaned)
    if (!cleaned) {
      setUnlockError(null)
      setUnlockMinutes(Math.min(15, availableBalance) || 0)
      return
    }
    const mins = Number.parseInt(cleaned, 10)
    if (!Number.isFinite(mins) || mins < 1) {
      setUnlockError(t('apps.unlockInvalidMinutes'))
      setUnlockMinutes(0)
      return
    }
    if (mins > availableBalance) {
      setUnlockError(t('apps.notEnoughBalance'))
      setUnlockMinutes(availableBalance)
      return
    }
    setUnlockError(null)
    setUnlockMinutes(mins)
  }

  const handleUnlock = () => {
    if (!showUnlock) return
    const mins = Math.floor(unlockMinutes)
    if (!Number.isFinite(mins) || mins < 1) {
      setUnlockError(t('apps.unlockInvalidMinutes'))
      return
    }
    if (mins > availableBalance) {
      setUnlockError(t('apps.notEnoughBalance'))
      toast(t('apps.notEnoughBalance'), 'error')
      return
    }
    const success = unlockApp(showUnlock, mins)
    if (success) {
      toast(t('apps.unlockedFor', { amount: formatMinutes(mins) }), 'success')
      setShowUnlock(null)
      setUnlockCustomInput('')
      setUnlockError(null)
    } else {
      const today = localDateString()
      const used = profile.openingsDate === today ? (profile.openingsUsedToday ?? 0) : 0
      const max = profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS
      if (max > 0 && used >= max) {
        toast(t('apps.openingsLimitReached'), 'error')
      } else {
        toast(t('apps.notEnoughBalance'), 'error')
      }
    }
  }

  const handleSelectApp = (app: DeviceAppDefinition) => {
    setPendingApp(app)
    // Prefer bridged nickname; never prefill opaque "App N" placeholders.
    const looksLikePlaceholder = /^App \d+$/i.test(app.name.trim())
    setPendingName(looksLikePlaceholder ? '' : app.name)
    setDailyLimit(30)
  }

  const handleConfirmAdd = () => {
    if (!pendingApp) return
    const needsName = onIos || Boolean(pendingApp.iosTokenId)
    if (needsName && !pendingName.trim()) {
      toast(t('apps.iosNameRequired'), 'error')
      return
    }
    const displayName = pendingName.trim() || pendingApp.name
    const success = addApp({
      name: displayName,
      icon: '',
      brand: pendingApp.brand,
      packageName: pendingApp.packageName,
      iosTokenId: pendingApp.iosTokenId,
      color: pendingApp.color,
      dailyLimitMinutes: dailyLimit,
    })
    if (success) {
      if (pendingApp.iosTokenId && pendingName.trim()) {
        void import('@/lib/replock-controls').then(({ setIosDisplayNames }) =>
          setIosDisplayNames({ [pendingApp.iosTokenId!]: pendingName.trim() })
        )
      }
      toast(displayName, 'success')
      setPendingApp(null)
    } else {
      const msg =
        trialStatus === 'expired'
          ? t('apps.limitReachedExpired', { limit: FREE_APP_LIMIT })
          : t('apps.limitReached')
      toast(msg, 'error')
      setPendingApp(null)
      void openUpgradeOrFallback(() => navigate('/pricing'))
    }
  }

  const openEditLimit = (appId: string, currentLimit: number) => {
    setEditLimitApp(appId)
    setEditLimitValue(currentLimit)
  }

  const handleSaveLimit = () => {
    if (!editLimitApp) return
    const clamped = Math.max(5, Math.min(180, editLimitValue))
    updateAppLimit(editLimitApp, clamped)
    toast(t('apps.limitUpdated', { amount: clamped }), 'success')
    setEditLimitApp(null)
  }

  const openRename = (appId: string) => {
    const app = apps.find((a) => a.id === appId)
    if (!app) return
    setRenameTarget(appId)
    setRenameValue(app.name)
  }

  const handleSaveRename = () => {
    if (!renameTarget || !renameValue.trim()) {
      toast(t('apps.iosNameRequired'), 'error')
      return
    }
    renameApp(renameTarget, renameValue.trim(), '')
    toast(t('apps.renameSaved'), 'success')
    setRenameTarget(null)
  }

  const handleViewNativeLabels = async () => {
    setNativeSheetLoading(true)
    try {
      const updated = await presentIosSelectedAppsSheet()
      for (const row of updated) {
        if (!row.hasCustomName) continue
        const match = apps.find((a) => a.iosTokenId === row.id)
        if (match && match.name !== row.name) {
          renameApp(match.id, row.name)
        }
      }
      toast(t('apps.iosNativeLabelsDone'), 'success')
    } catch {
      toast(t('apps.iosPickError_failed'), 'error')
    } finally {
      setNativeSheetLoading(false)
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 max-w-lg mx-auto w-full"
      >
        <PageHeader
          centered
          title={t('apps.title')}
          subtitle={`${t('apps.appsCount', { count: apps.length, limit: appLimitLabel })} · ${formatMinutes(screenTimeBalance)} ${t('apps.available')}`}
          action={
            canAddApps ? (
              <Button
                variant="secondary"
                size="sm"
                className="border-white/10 bg-white/[0.04]"
                onClick={() => setShowPicker(true)}
              >
                <Plus size={16} />
                {t('common.add')}
              </Button>
            ) : undefined
          }
        />

        <section>
          <div className="space-y-2">
            {apps.map((app, i) => {
              const isUnlocked = !app.isLocked

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                  className={cn(
                    'rounded-2xl px-4 py-3.5',
                    'bg-white/[0.03] border border-white/[0.07]'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-[15px] tracking-tight truncate">
                          {app.name}
                        </h3>
                        {isUnlocked ? (
                          <Badge variant="success">{t('common.unlocked')}</Badge>
                        ) : (
                          <Badge variant="danger">{t('common.locked')}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        {app.usedMinutes}/{app.dailyLimitMinutes}
                        {t('common.minutes')}
                        {isUnlocked && app.unlockedUntil && (
                          <> · {formatTimeRemaining(app.unlockedUntil)} {t('apps.left')}</>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openRename(app.id)}
                      className="p-2 rounded-lg hover:bg-emerald-500/10 text-white/20 hover:text-emerald-400 transition-colors"
                      aria-label={t('apps.renameApp')}
                    >
                      <Pencil size={16} />
                    </button>
                    {canEditLimits && (
                      <button
                        type="button"
                        onClick={() => openEditLimit(app.id, app.dailyLimitMinutes)}
                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-white/20 hover:text-emerald-400 transition-colors"
                        aria-label={t('apps.editLimit')}
                      >
                        <Clock size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(app.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                      aria-label={t('apps.removeApp')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Progress value={app.usedMinutes} max={app.dailyLimitMinutes} size="sm" />

                  {app.isLocked ? (
                    <MotionButton
                      variant="outline"
                      size="sm"
                      fullWidth
                      className="mt-3 border-white/10 bg-transparent hover:bg-white/[0.04]"
                      onClick={() => {
                        setShowUnlock(app.id)
                        setUnlockCustomInput('')
                        setUnlockError(null)
                        setUnlockMinutes(Math.min(15, Math.max(0, Math.floor(screenTimeBalance))))
                      }}
                    >
                      <Unlock size={14} />
                      {t('apps.unlockWithTime')}
                    </MotionButton>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                      <Unlock size={12} />
                      {t('apps.activeUntil')}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {apps.length === 0 && (
            <div className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                <Grid3X3 size={26} className="text-teal-400" />
              </div>
              <p className="text-white/45">{t('apps.noApps')}</p>
              {!onIos && (
                <Button
                  variant="secondary"
                  className="mt-4 border-white/10 bg-white/[0.04]"
                  onClick={() => setShowPicker(true)}
                >
                  {t('apps.addFirst')}
                </Button>
              )}
            </div>
          )}

          {onIos && apps.some((a) => a.iosTokenId) && (
            <button
              type="button"
              disabled={nativeSheetLoading}
              onClick={() => void handleViewNativeLabels()}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 bg-transparent border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/80 transition-colors disabled:opacity-50"
            >
              <Eye size={15} />
              {t('apps.iosViewSystemLabels')}
            </button>
          )}
        </section>

        <div className="space-y-3">
          {/* One promo only: trial remaining while on trial; upgrade when free/expired; nothing when Pro */}
          <TrialBanner compact />
          <AppsHubRow />
          <BlockerSetupCard compact />
        </div>
      </motion.div>

      <DeviceAppPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectApp}
        excludeIds={existingIds}
      />

      <Modal
        open={!!pendingApp}
        onClose={() => setPendingApp(null)}
        title={t('apps.addApp')}
        position="center"
      >
        {pendingApp && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
              <p className="font-semibold text-sm truncate">{pendingName || pendingApp.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{t('apps.setDailyLimit')}</p>
            </div>

            {(onIos || pendingApp.iosTokenId) && (
              <>
                <Input
                  id="pending-app-name"
                  label={t('apps.renameLabel')}
                  placeholder={t('apps.renamePlaceholder')}
                  value={pendingName}
                  onChange={(e) => setPendingName(e.target.value)}
                />
                <p className="text-xs text-white/35 -mt-2">{t('apps.iosNamePrivacyNote')}</p>
              </>
            )}

            <Input
              id="daily-limit"
              label={t('apps.dailyLimitLabel')}
              type="number"
              min={5}
              max={180}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />

            <MotionButton
              fullWidth
              size="lg"
              onClick={handleConfirmAdd}
              disabled={(onIos || Boolean(pendingApp.iosTokenId)) && !pendingName.trim()}
            >
              {t('apps.addApp')}
            </MotionButton>
          </div>
        )}
      </Modal>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t('apps.removeConfirm')}
        position="center"
      >
        <p className="text-sm text-white/50 mb-4">{t('apps.removeConfirmDesc')}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setRemoveTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (!removeTarget) return
              removeApp(removeTarget)
              setRemoveTarget(null)
            }}
          >
            {t('apps.remove')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={t('apps.renameTitle')}
        position="center"
      >
        <div className="space-y-4">
          <Input
            id="rename-app"
            label={t('apps.renameLabel')}
            placeholder={t('apps.renamePlaceholder')}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          {onIos && (
            <p className="text-xs text-white/35 -mt-2">{t('apps.iosNamePrivacyNote')}</p>
          )}
          <MotionButton fullWidth size="lg" onClick={handleSaveRename} disabled={!renameValue.trim()}>
            {t('apps.renameSave')}
          </MotionButton>
        </div>
      </Modal>

      <Modal
        open={!!editLimitApp}
        onClose={() => setEditLimitApp(null)}
        title={t('apps.editLimitTitle')}
        position="center"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/50">{t('apps.setDailyLimit')}</p>
          <Input
            id="edit-daily-limit"
            label={t('apps.dailyLimitLabel')}
            type="number"
            min={5}
            max={180}
            value={editLimitValue}
            onChange={(e) => setEditLimitValue(Number(e.target.value))}
          />
          <MotionButton fullWidth size="lg" onClick={handleSaveLimit}>
            {t('apps.saveLimit')}
          </MotionButton>
        </div>
      </Modal>

      <Modal
        open={!!showUnlock}
        onClose={() => {
          setShowUnlock(null)
          setUnlockCustomInput('')
          setUnlockError(null)
        }}
        title={t('apps.unlockApp')}
        position="center"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/50">{t('apps.unlockDesc')}</p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <Clock size={16} className="text-emerald-400" />
            <span className="text-sm">
              {t('apps.balance')}:{' '}
              <span className="font-semibold text-white">{formatMinutes(availableBalance)}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[5, 15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => selectUnlockPreset(mins)}
                disabled={mins > availableBalance}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium transition-all',
                  unlockMinutes === mins && !unlockCustomInput
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/[0.03] border border-white/[0.07] text-white/60 hover:border-white/15 disabled:opacity-30'
                )}
              >
                {mins}
                {t('common.minutes')}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="unlock-custom-minutes" className="text-xs text-white/45">
              {t('apps.unlockCustomLabel')}
            </label>
            <Input
              id="unlock-custom-minutes"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder={t('apps.unlockCustomPlaceholder')}
              value={unlockCustomInput}
              onChange={(e) => applyCustomUnlockInput(e.target.value)}
              disabled={availableBalance < 1}
              className={cn(unlockError && 'border-red-500/50 focus:border-red-500/60')}
            />
            {unlockError ? (
              <p className="text-xs text-red-400" role="alert">
                {unlockError}
              </p>
            ) : (
              <p className="text-xs text-white/35">{t('apps.unlockCustomHint')}</p>
            )}
          </div>

          <MotionButton
            fullWidth
            size="lg"
            onClick={handleUnlock}
            disabled={
              availableBalance < 1 ||
              unlockMinutes < 1 ||
              unlockMinutes > availableBalance ||
              !!unlockError
            }
          >
            {t('apps.unlockFor', { amount: formatMinutes(Math.max(0, unlockMinutes)) })}
          </MotionButton>
        </div>
      </Modal>
    </AppShell>
  )
}
