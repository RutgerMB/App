import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { Lock, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MotionButton } from '@/components/ui/Button'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'
import {
  getTodayVsYesterday,
  getPeriodStats,
  getPeriodTotals,
  getCategoryBreakdown,
  type StatsPeriod,
} from '@/lib/analytics'
import { EXERCISES } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PERIODS: StatsPeriod[] = ['week', 'month', 'year']

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const minutes = Math.round(payload[0].value ?? 0)
  return (
    <div className="rounded-xl border border-indigo-500/30 bg-surface-2/95 backdrop-blur-md px-3 py-2.5 shadow-xl shadow-black/40">
      <p className="text-[11px] font-medium text-indigo-300/90 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        {t('activity.earned')}: <span className="text-indigo-300">{minutes}m</span>
      </p>
    </div>
  )
}

export function ActivityInsights() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { sessions, profile } = useStore()
  const [period, setPeriod] = useState<StatsPeriod>('week')
  const isPro = profile.isPro

  const comparison = getTodayVsYesterday(sessions)
  const periodStats = getPeriodStats(sessions, period)
  const totals = getPeriodTotals(periodStats)
  const categories = getCategoryBreakdown(sessions, (type) =>
    t(`categories.${EXERCISES[type as keyof typeof EXERCISES]?.category ?? 'cardio'}`)
  )

  const periodLabel = {
    week: t('activity.periodWeek'),
    month: t('activity.periodMonth'),
    year: t('activity.periodYear'),
  }

  return (
    <div className="mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          {t('activity.insights')}
        </h2>
        {isPro ? (
          <Badge variant="pro">{t('common.pro')}</Badge>
        ) : (
          <Badge variant="default">{t('common.free')}</Badge>
        )}
      </div>

      <div className={cn('relative', !isPro && 'select-none')}>
        {/* Today vs Yesterday */}
        <MotionCard className="p-5 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-4">{t('activity.todayVsYesterday')}</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs text-indigo-300 mb-1">{t('activity.todayLabel')}</p>
              <p className="text-2xl font-bold">{formatMinutes(comparison.today)}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-3 border border-border">
              <p className="text-xs text-white/40 mb-1">{t('activity.yesterdayLabel')}</p>
              <p className="text-2xl font-bold text-white/70">{formatMinutes(comparison.yesterday)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {comparison.change >= 0 ? (
              <TrendingUp size={16} className="text-emerald-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
            <span className={comparison.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {comparison.change >= 0 ? '+' : ''}{formatMinutes(Math.abs(comparison.change))}
            </span>
            <span className="text-white/40">
              ({t('activity.change', { value: comparison.changePercent })})
            </span>
          </div>
        </MotionCard>

        {/* Period selector */}
        <div className="flex gap-2 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
                period === p
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-surface-2 border-border text-white/40 hover:text-white/60'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <MotionCard className="p-4 mb-4">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2">{t('activity.minutesEarned')}</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodStats}
                margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  tickLine={false}
                  interval={period === 'year' ? 'preserveStartEnd' : 0}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}m`}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(94,106,210,0.08)' }} />
                <Bar dataKey="earnedMinutes" radius={[4, 4, 0, 0]}>
                  {periodStats.map((entry, i) => (
                    <Cell
                      key={entry.date}
                      fill={i === periodStats.length - 1 ? '#5E6AD2' : 'rgba(94,106,210,0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>

        {/* Period totals */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MotionCard className="p-3 text-center">
            <p className="text-lg font-bold gradient-text">{formatMinutes(totals.totalEarned)}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1">{t('activity.totalEarned')}</p>
          </MotionCard>
          <MotionCard className="p-3 text-center">
            <p className="text-lg font-bold">{formatMinutes(totals.avgDaily)}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1">{t('activity.avgDaily')}</p>
          </MotionCard>
          <MotionCard className="p-3 text-center">
            <p className="text-lg font-bold">{formatMinutes(totals.bestDay.earnedMinutes)}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1">{t('activity.bestDay')}</p>
          </MotionCard>
        </div>

        {/* Category split */}
        {categories.length > 0 && (
          <MotionCard className="p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">{t('activity.categorySplit')}</p>
            <div className="space-y-2">
              {categories.map((cat) => {
                const max = categories[0]?.minutes ?? 1
                const pct = (cat.minutes / max) * 100
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{cat.category}</span>
                      <span className="text-white/40">{formatMinutes(cat.minutes)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </MotionCard>
        )}

        {/* Free user overlay */}
        {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-md bg-surface-0/60" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 mx-6 p-6 rounded-2xl bg-surface-2 border border-indigo-500/30 text-center max-w-sm"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Lock size={22} className="text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-2">{t('activity.unlockInsights')}</h3>
              <p className="text-sm text-white/45 mb-5 leading-relaxed">{t('activity.unlockInsightsDesc')}</p>
              <MotionButton fullWidth onClick={() => navigate('/pricing')}>
                <Sparkles size={16} />
                {t('common.upgrade')}
              </MotionButton>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
