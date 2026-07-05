import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Lock, Unlock, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button, MotionButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { DeviceAppPicker } from '@/components/DeviceAppPicker'
import { useStore } from '@/store'
import { FREE_APP_LIMIT } from '@/types'
import { getAppLimitLabel, getTrialStatus } from '@/lib/trial'
import { formatMinutes, formatTimeRemaining } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { AppIcon } from '@/components/AppBrandIcon'
import { TrialBanner } from '@/components/TrialBanner'
import { ProPromo } from '@/components/ProPromo'
import { BlockerSetupCard } from '@/components/BlockerSetupCard'
import { useTranslation } from '@/i18n/context'
import type { DeviceAppDefinition } from '@/data/device-apps'

export function AppsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { apps, profile, screenTimeBalance, unlockApp, addApp, removeApp } = useStore()
  const trialStatus = getTrialStatus(profile)
  const appLimitLabel = getAppLimitLabel(profile)

  const [showPicker, setShowPicker] = useState(false)
  const [pendingApp, setPendingApp] = useState<DeviceAppDefinition | null>(null)
  const [dailyLimit, setDailyLimit] = useState(30)
  const [showUnlock, setShowUnlock] = useState<string | null>(null)
  const [unlockMinutes, setUnlockMinutes] = useState(15)

  const existingIds = apps.flatMap((a) => [a.brand ?? '', a.packageName ?? '', a.name.toLowerCase()])

  const handleUnlock = () => {
    if (!showUnlock) return
    const success = unlockApp(showUnlock, unlockMinutes)
    if (success) {
      toast(t('apps.unlockedFor', { amount: formatMinutes(unlockMinutes) }), 'success')
      setShowUnlock(null)
    } else {
      toast(t('apps.notEnoughBalance'), 'error')
    }
  }

  const handleSelectApp = (app: DeviceAppDefinition) => {
    setPendingApp(app)
    setDailyLimit(30)
  }

  const handleConfirmAdd = () => {
    if (!pendingApp) return
    const success = addApp({
      name: pendingApp.name,
      icon: '',
      brand: pendingApp.brand,
      packageName: pendingApp.packageName,
      color: pendingApp.color,
      dailyLimitMinutes: dailyLimit,
    })
    if (success) {
      toast(pendingApp.name, 'success')
      setPendingApp(null)
    } else {
      const msg =
        trialStatus === 'expired'
          ? t('apps.limitReachedExpired', { limit: FREE_APP_LIMIT })
          : t('apps.limitReached')
      toast(msg, 'error')
      setPendingApp(null)
      navigate('/pricing')
    }
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <TrialBanner compact />

        <BlockerSetupCard compact />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('apps.title')}</h1>
            <p className="text-white/40 text-sm mt-1">
              {t('apps.appsCount', { count: apps.length, limit: appLimitLabel })} · {formatMinutes(screenTimeBalance)} {t('apps.available')}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>
            <Plus size={16} />
            {t('common.add')}
          </Button>
        </div>

        <div className="space-y-3">
          {apps.map((app, i) => {
            const isUnlocked = !app.isLocked

            return (
              <MotionCard key={app.id} className="p-4" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3 mb-3">
                  <AppIcon
                    brand={app.brand}
                    name={app.name}
                    icon={app.icon}
                    color={app.color}
                    size="lg"
                    grayscale={!isUnlocked}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                      {isUnlocked ? (
                        <Badge variant="success">{t('common.unlocked')}</Badge>
                      ) : (
                        <Badge variant="danger">{t('common.locked')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {app.usedMinutes}/{app.dailyLimitMinutes}{t('common.minutes')} {t('apps.dailyLimit')}
                      {isUnlocked && app.unlockedUntil && (
                        <> · {formatTimeRemaining(app.unlockedUntil)} {t('apps.left')}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeApp(app.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
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
                    className="mt-3"
                    onClick={() => {
                      setShowUnlock(app.id)
                      setUnlockMinutes(Math.min(15, screenTimeBalance))
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
              </MotionCard>
            )
          })}
        </div>

        {apps.length === 0 && (
          <div className="text-center py-16">
            <Lock size={40} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40">{t('apps.noApps')}</p>
            <Button variant="secondary" className="mt-4" onClick={() => setShowPicker(true)}>
              {t('apps.addFirst')}
            </Button>
          </div>
        )}

        <ProPromo variant="apps" compact className="mt-6" />
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-3 border border-border">
              <AppIcon brand={pendingApp.brand} name={pendingApp.name} color={pendingApp.color} size="lg" />
              <div>
                <p className="font-semibold text-sm">{pendingApp.name}</p>
                <p className="text-xs text-white/40">{t('apps.setDailyLimit')}</p>
              </div>
            </div>

            <Input
              id="daily-limit"
              label={t('apps.dailyLimitLabel')}
              type="number"
              min={5}
              max={180}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />

            <MotionButton fullWidth size="lg" onClick={handleConfirmAdd}>
              {t('apps.addApp')}
            </MotionButton>
          </div>
        )}
      </Modal>

      <Modal open={!!showUnlock} onClose={() => setShowUnlock(null)} title={t('apps.unlockApp')} position="center">
        <div className="space-y-4">
          <p className="text-sm text-white/50">{t('apps.unlockDesc')}</p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-3 border border-border">
            <Clock size={16} className="text-indigo-400" />
            <span className="text-sm">
              {t('apps.balance')}: <span className="font-semibold text-white">{formatMinutes(screenTimeBalance)}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[5, 15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => setUnlockMinutes(mins)}
                disabled={mins > screenTimeBalance}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  unlockMinutes === mins
                    ? 'bg-indigo-500/20 border-2 border-indigo-500/50 text-indigo-300'
                    : 'bg-surface-3 border border-border text-white/60 hover:border-border-hover disabled:opacity-30'
                }`}
              >
                {mins}{t('common.minutes')}
              </button>
            ))}
          </div>

          <MotionButton
            fullWidth
            size="lg"
            onClick={handleUnlock}
            disabled={unlockMinutes > screenTimeBalance || unlockMinutes < 1}
          >
            {t('apps.unlockFor', { amount: formatMinutes(unlockMinutes) })}
          </MotionButton>
        </div>
      </Modal>
    </AppShell>
  )
}
