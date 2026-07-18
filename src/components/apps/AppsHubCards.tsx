import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button, MotionButton } from '@/components/ui/Button'
import { useStore } from '@/store'
import { DEFAULT_DAILY_OPENINGS } from '@/types'
import { localDateString } from '@/lib/dates'
import { useTranslation } from '@/i18n/context'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import {
  clampUnlocksLeft,
  digitsOnly,
  MAX_UNLOCKS_LEFT,
  MIN_UNLOCKS_LEFT,
  parseDigitInt,
} from '@/lib/numeric-input'

function openingsUsedToday(openingsDate: string | null | undefined, used: number | undefined) {
  const today = localDateString()
  if (openingsDate !== today) return 0
  return used ?? 0
}

export function ActiveScheduleCard() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const profile = useStore((s) => s.profile)
  const apps = useStore((s) => s.apps)
  const setOpeningsLeftToday = useStore((s) => s.setOpeningsLeftToday)

  const dailyOpenings = profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS
  const used = openingsUsedToday(profile.openingsDate, profile.openingsUsedToday)
  const left = Math.max(0, dailyOpenings - used)
  const minutesPerOpening = profile.minutesPerOpening ?? 5

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draftLeft, setDraftLeft] = useState(String(Math.max(MIN_UNLOCKS_LEFT, left)))

  if (apps.length === 0) return null

  const openEdit = () => {
    setDraftLeft(String(clampUnlocksLeft(Math.max(MIN_UNLOCKS_LEFT, left))))
    setEditOpen(true)
  }

  const parsedDraft = (): number => {
    const n = parseDigitInt(draftLeft)
    return clampUnlocksLeft(n ?? MIN_UNLOCKS_LEFT)
  }

  const requestConfirm = () => {
    const next = parsedDraft()
    setDraftLeft(String(next))
    if (next === left) {
      setEditOpen(false)
      return
    }
    setEditOpen(false)
    setConfirmOpen(true)
  }

  const applyChange = () => {
    const next = parsedDraft()
    setOpeningsLeftToday(next)
    setConfirmOpen(false)
    toast(t('apps.unlocksLeftUpdated', { count: next }), 'success')
  }

  return (
    <>
      <button
        type="button"
        onClick={openEdit}
        className={cn(
          'w-full text-left rounded-2xl px-5 py-5',
          'bg-gradient-to-br from-teal-500/12 to-emerald-500/5 border border-teal-500/20',
          'hover:border-teal-500/35 active:scale-[0.99] transition-all duration-200'
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-white/90">
              {t('apps.activeScheduleTitle')}
            </p>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              {t('apps.unlocksLeftHint', { minutes: minutesPerOpening })}
            </p>
          </div>
          <span className="shrink-0 p-2 rounded-lg bg-teal-500/15 text-teal-300">
            <Pencil size={15} />
          </span>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">
            {left}
          </span>
          <span className="text-sm text-white/35 mb-1.5">
            / {dailyOpenings}
          </span>
        </div>

        <Progress value={used} max={Math.max(1, dailyOpenings)} size="sm" />
      </button>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('apps.unlocksLeftEditTitle')}
        position="center"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/50 leading-relaxed">{t('apps.unlocksLeftEditDesc')}</p>
          <Input
            id="unlocks-left-today"
            label={t('apps.unlocksLeftLabel')}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            min={MIN_UNLOCKS_LEFT}
            max={MAX_UNLOCKS_LEFT}
            value={draftLeft}
            onChange={(e) => setDraftLeft(digitsOnly(e.target.value, 3))}
          />
          <MotionButton fullWidth size="lg" onClick={requestConfirm}>
            {t('apps.unlocksLeftContinue')}
          </MotionButton>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('apps.unlocksLeftConfirmTitle')}
        position="center"
      >
        <p className="text-sm text-white/50 mb-4 leading-relaxed">
          {t('apps.unlocksLeftConfirmDesc', { count: parsedDraft() })}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" onClick={applyChange}>
            {t('apps.unlocksLeftConfirmCta')}
          </Button>
        </div>
      </Modal>
    </>
  )
}

/** Unlocks-left card when the user has a blocking goal and apps. */
export function AppsHubRow() {
  return <ActiveScheduleCard />
}
