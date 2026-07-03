import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTIES, DIFFICULTY_MULTIPLIERS, FREE_DIFFICULTY, isProDifficulty } from '@/lib/earning'
import type { Difficulty } from '@/types'
import { useTranslation } from '@/i18n/context'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/Badge'

const DIFFICULTY_META: Record<Difficulty, { icon: string; gradient: string }> = {
  easy: { icon: '🌱', gradient: 'from-emerald-500 to-teal-500' },
  medium: { icon: '⚖️', gradient: 'from-indigo-500 to-violet-500' },
  hard: { icon: '🔥', gradient: 'from-orange-500 to-red-500' },
  unstoppable: { icon: '💀', gradient: 'from-red-600 to-rose-700' },
}

interface DifficultyPickerProps {
  value: Difficulty
  onChange: (difficulty: Difficulty) => void
  compact?: boolean
}

export function DifficultyPicker({ value, onChange, compact }: DifficultyPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isPro = useStore((s) => s.profile.isPro)

  const handleSelect = (d: Difficulty) => {
    if (!isPro && isProDifficulty(d)) {
      navigate('/pricing')
      return
    }
    onChange(d)
  }

  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1')}>
      {DIFFICULTIES.map((d) => {
        const meta = DIFFICULTY_META[d]
        const mult = DIFFICULTY_MULTIPLIERS[d]
        const selected = value === d
        const locked = !isPro && isProDifficulty(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => handleSelect(d)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-2xl border text-left transition-all relative',
              selected
                ? 'bg-indigo-500/15 border-indigo-500/40'
                : locked
                  ? 'bg-surface-2/50 border-border opacity-80'
                  : 'bg-surface-2 border-border hover:border-border-hover'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shrink-0',
              meta.gradient,
              locked && 'opacity-60'
            )}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{t(`difficulty.${d}.name`)}</p>
                {d === FREE_DIFFICULTY && !isPro && (
                  <Badge variant="default" className="text-[9px] px-1.5 py-0">{t('common.free')}</Badge>
                )}
                {locked && (
                  <Badge variant="pro" className="text-[9px] px-1.5 py-0">{t('common.pro')}</Badge>
                )}
              </div>
              <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{t(`difficulty.${d}.desc`)}</p>
              {!compact && (
                <p className="text-[10px] text-indigo-400/80 mt-1">{t('difficulty.earnRate', { value: Math.round(mult * 100) })}</p>
              )}
            </div>
            {locked ? (
              <Lock size={14} className="text-white/25 shrink-0" />
            ) : selected ? (
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            ) : null}
          </button>
        )
      })}
      {!isPro && (
        <p className={cn('text-xs text-white/35 leading-relaxed', compact ? 'col-span-2' : '')}>
          {t('difficulty.proOnly')}
        </p>
      )}
    </div>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useTranslation()
  const meta = DIFFICULTY_META[difficulty]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-border text-xs font-medium text-white/70">
      <span>{meta.icon}</span>
      {t(`difficulty.${difficulty}.name`)}
    </span>
  )
}
