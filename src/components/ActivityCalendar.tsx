import { useEffect, useMemo, useRef, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { useStore } from '@/store'
import { EXERCISES } from '@/types'
import { formatDate, formatMinutes, cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import {
  localDateString,
  msUntilNextLocalMidnight,
  parseLocalDateString,
  reconcileCalendarMonthKey,
} from '@/lib/dates'
import {
  activityIntensityLevel,
  dayActivityScore,
  HEATMAP_JADE_LEVELS,
} from '@/lib/analytics'

function monthKeyFromDate(d: Date): string {
  return localDateString(d).slice(0, 7)
}

function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKeyFromDate(d)
}

function buildMonthCells(monthKey: string) {
  const first = parseLocalDateString(`${monthKey}-01`)
  const year = first.getFullYear()
  const month = first.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Sunday-first to match common contribution calendars
  const startPad = first.getDay()
  const cells: Array<{ date: string | null; dayNum: number | null }> = []
  for (let i = 0; i < startPad; i++) {
    cells.push({ date: null, dayNum: null })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ date: localDateString(d), dayNum: day })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNum: null })
  }
  return cells
}

export function ActivityCalendar() {
  const { t } = useTranslation()
  const sessions = useStore((s) => s.sessions)
  const createdAt = useStore((s) => s.profile.createdAt)

  const [todayKey, setTodayKey] = useState(() => localDateString())
  const currentMonthKey = todayKey.slice(0, 7)
  const joinMonthKey = monthKeyFromDate(new Date(createdAt || Date.now()))

  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const previousCurrentMonthRef = useRef(currentMonthKey)

  useEffect(() => {
    const syncToday = () => {
      const nextToday = localDateString()
      setTodayKey((prev) => (prev === nextToday ? prev : nextToday))
    }

    syncToday()

    const onVisible = () => {
      if (document.visibilityState === 'visible') syncToday()
    }
    document.addEventListener('visibilitychange', onVisible)

    let midnightTimer: ReturnType<typeof setTimeout> | undefined
    const scheduleMidnight = () => {
      midnightTimer = setTimeout(() => {
        syncToday()
        scheduleMidnight()
      }, msUntilNextLocalMidnight())
    }
    scheduleMidnight()

    let appHandle: { remove: () => Promise<void> } | undefined
    if (Capacitor.isNativePlatform()) {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) syncToday()
      }).then((h) => {
        appHandle = h
      })
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (midnightTimer !== undefined) clearTimeout(midnightTimer)
      void appHandle?.remove()
    }
  }, [])

  useEffect(() => {
    const previousCurrent = previousCurrentMonthRef.current
    if (previousCurrent === currentMonthKey) return
    setMonthKey((view) =>
      reconcileCalendarMonthKey(view, previousCurrent, currentMonthKey),
    )
    previousCurrentMonthRef.current = currentMonthKey
  }, [currentMonthKey])

  const byDate = useMemo(() => {
    const map = new Map<string, typeof sessions>()
    for (const s of sessions) {
      const key = localDateString(new Date(s.completedAt))
      const list = map.get(key) ?? []
      list.push(s)
      map.set(key, list)
    }
    return map
  }, [sessions])

  const cells = useMemo(() => buildMonthCells(monthKey), [monthKey])

  const scores = useMemo(() => {
    const result = new Map<string, number>()
    let max = 0
    for (const cell of cells) {
      if (!cell.date) continue
      const daySessions = byDate.get(cell.date) ?? []
      const score = dayActivityScore(
        daySessions.length,
        daySessions.reduce((sum, s) => sum + s.earnedMinutes, 0),
      )
      result.set(cell.date, score)
      if (score > max) max = score
    }
    return { byDate: result, max }
  }, [cells, byDate])

  const monthLabel = useMemo(() => {
    const d = parseLocalDateString(`${monthKey}-01`)
    return d.toLocaleDateString([], { month: 'long', year: 'numeric' })
  }, [monthKey])

  const weekdayLabels = useMemo(() => {
    // Sun–Sat short labels from a known week
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 7 + i) // Sunday start
      return d.toLocaleDateString([], { weekday: 'narrow' })
    })
  }, [])

  const canPrev = monthKey > joinMonthKey
  const canNext = monthKey < currentMonthKey

  const selectedSessions = selectedDate ? byDate.get(selectedDate) ?? [] : []
  const selectedEarned = selectedSessions.reduce((s, x) => s + x.earnedMinutes, 0)

  return (
    <section>
      <div className="text-center mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          {t('activity.calendarTitle')}
        </h2>
        <div className="mx-auto mt-3 h-px w-10 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      </div>

      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setMonthKey((m) => addMonths(m, -1))}
            className="p-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.05] disabled:opacity-25 disabled:pointer-events-none"
            aria-label={t('activity.calendarPrev')}
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-semibold tracking-tight">{monthLabel}</p>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setMonthKey((m) => addMonths(m, 1))}
            className="p-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.05] disabled:opacity-25 disabled:pointer-events-none"
            aria-label={t('activity.calendarNext')}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {weekdayLabels.map((label, i) => (
            <div key={i} className="text-center text-[10px] text-white/35 uppercase tracking-wider py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell.date) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }
            const score = scores.byDate.get(cell.date) ?? 0
            const level = activityIntensityLevel(score, scores.max)
            const isFuture = cell.date > todayKey
            const isSelected = selectedDate === cell.date
            const isToday = cell.date === todayKey
            return (
              <button
                key={cell.date}
                type="button"
                disabled={isFuture}
                onClick={() => setSelectedDate(cell.date)}
                className={cn(
                  'aspect-square rounded-md text-[10px] font-medium tabular-nums transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50',
                  isFuture && 'opacity-20 pointer-events-none',
                  isSelected && 'ring-2 ring-emerald-400/70',
                  isToday && !isSelected && 'ring-1 ring-white/25',
                )}
                style={{ backgroundColor: HEATMAP_JADE_LEVELS[level] }}
                aria-label={cell.date}
              >
                <span className={cn(level >= 3 ? 'text-white' : 'text-white/70')}>
                  {cell.dayNum}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-white/30 mr-1">{t('activity.calendarLess')}</span>
          {HEATMAP_JADE_LEVELS.map((color, i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[10px] text-white/30 ml-1">{t('activity.calendarMore')}</span>
        </div>
      </div>

      {selectedDate && (
        <div className="mt-4 space-y-3">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {selectedDate === todayKey
                ? t('activity.today')
                : formatDate(parseLocalDateString(selectedDate).getTime())}
            </p>
            <p className="text-xs text-white/45 mt-1">
              {t('activity.calendarDaySummary', {
                workouts: selectedSessions.length,
                minutes: formatMinutes(selectedEarned),
              })}
            </p>
          </div>

          {selectedSessions.length === 0 ? (
            <p className="text-center text-sm text-white/35 py-4">{t('activity.calendarEmptyDay')}</p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((session) => {
                const ex = EXERCISES[session.type]
                return (
                  <div
                    key={session.id}
                    className="rounded-2xl px-4 py-3.5 bg-white/[0.03] border border-white/[0.07]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/30',
                          ex.gradient,
                        )}
                      >
                        <ExerciseIcon type={session.type} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] tracking-tight truncate">
                          {t(`exercises.${session.type}.name`)}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">
                          {session.amount}{' '}
                          {ex.unit === 'reps' ? t('common.reps') : t('common.seconds')}
                        </p>
                      </div>
                      <Badge variant="success">+{formatMinutes(session.earnedMinutes)}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
