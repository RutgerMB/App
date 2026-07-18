import { ExternalLink, Play } from 'lucide-react'
import type { ExerciseType } from '@/types'
import { EXERCISES } from '@/types'
import { getMuscleWikiLink } from '@/lib/musclewiki-links'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

interface ExerciseDemoVideoProps {
  type: ExerciseType
  className?: string
}

export function ExerciseDemoVideo({ type, className }: ExerciseDemoVideoProps) {
  const { t } = useTranslation()
  const exercise = EXERCISES[type]
  const pageUrl = getMuscleWikiLink(type)

  const openMuscleWiki = () => {
    window.open(pageUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={openMuscleWiki}
      className={cn(
        'relative w-full max-w-[280px] mx-auto aspect-[4/5] rounded-3xl bg-surface-2 border border-border overflow-hidden text-left hover:bg-white/[0.03] transition-colors',
        className
      )}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${exercise.gradient} opacity-[0.1]`} />

      <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${exercise.gradient} flex items-center justify-center shadow-lg`}>
          <Play size={28} className="text-white ml-1" fill="white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/90">{t('exercise.watchDemo')}</p>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">{t('exercise.watchDemoHint')}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
          MuscleWiki
          <ExternalLink size={12} />
        </span>
      </div>
    </button>
  )
}
