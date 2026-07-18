import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Lock, TrendingUp, TrendingDown, Sparkles, Smartphone, ShieldAlert, Clock,
} from 'lucide-react'
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
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'
import {
  loadUsageInsights,
  type UsageInsightsSnapshot,
} from '@/lib/usage-insights'
import { requestScreenTimePermission } from '@/lib/screen-time'
import { sumUsagePeriod, aggregateByAppForPeriod, type UsagePeriod } from '@/lib/usage-history'
import type { UsageAppDay } from '@/types'

const PERIODS: StatsPeriod[] = ['week', 'month', 'year']
const USAGE_PERIODS: UsagePeriod[] = ['day', 'week', 'month']

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
}) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const minutes = Math.round(payload[0].value ?? 0)
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-surface-2/95 backdrop-blur-md px-3 py-2.5 shadow-xl shadow-black/40">
      <p className="text-[11px] font-medium text-emerald-300/90 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        {t('activity.earned')}: <span className="text-emerald-300">{minutes}m</span>
      </p>
    </div>
  )
}

function UsageSection({
  usage,
  usagePeriod,
  onPeriodChange,
  periodTotals,
  byAppRows,
}: {
  usage: UsageInsightsSnapshot | null
  usagePeriod: UsagePeriod
  onPeriodChange: (p: UsagePeriod) => void
  periodTotals: { unlockedMinutes: number; unlockOpenings: number }
  byAppRows: UsageAppDay[]
}) {
  const { t } = useTranslation()
  if (!usage) return null

  const showOsDayMetrics = usage.platform === 'android' && usagePeriod === 'day'
  const appRows: UsageAppDay[] =
    usagePeriod === 'day'
      ? usage.apps
          .filter(
            (a) =>
              (showOsDayMetrics && (a.screenMinutes ?? 0) > 0) ||
              a.unlockedMinutes > 0 ||
              (showOsDayMetrics && (a.blockAttempts ?? 0) > 0)
          )
          .map((a) => ({
            id: a.id,
            name: a.name,
            color: a.color,
            unlockedMinutes:
              showOsDayMetrics && a.screenMinutes != null ? a.screenMinutes : a.unlockedMinutes,
          }))
      : byAppRows

  const hasAppRows = appRows.length > 0

  const periodLabel = {
    day: t('activity.periodDay'),
    week: t('activity.periodWeek'),
    month: t('activity.periodMonth'),
  }

  return (
    <div className="space-y-4 mb-4">
      <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Smartphone size={14} className="text-emerald-300/80" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t('activity.usageTitle')}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          {USAGE_PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
                usagePeriod === p
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-300 mb-1">{t('activity.unlockedSessionTime')}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatMinutes(periodTotals.unlockedMinutes)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock size={12} className="text-emerald-300/70" />
              <p className="text-xs text-white/40">{t('activity.unlockOpenings')}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{periodTotals.unlockOpenings}</p>
          </div>
        </div>

        {/* Android-only OS metrics for today — never show broken iOS placeholders */}
        {showOsDayMetrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                {t('activity.minutesSpent')}
              </p>
              {usage.totalScreenMinutes != null ? (
                <p className="text-xl font-bold tabular-nums">
                  {formatMinutes(usage.totalScreenMinutes)}
                </p>
              ) : usage.screenTimePermissionNeeded ? (
                <button
                  type="button"
                  onClick={() => {
                    void requestScreenTimePermission()
                  }}
                  className="text-xs font-medium text-emerald-300 underline underline-offset-2"
                >
                  {t('activity.grantUsageAccess')}
                </button>
              ) : (
                <p className="text-sm text-white/40">—</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldAlert size={12} className="text-amber-400/80" />
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  {t('activity.blockAttempts')}
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {usage.blockAttempts?.total ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>

          {hasAppRows && (
        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3 text-center">
            {t('activity.byApp')}
          </p>
          <div className="space-y-3">
            {appRows.slice(0, 8).map((app) => {
              const daySource =
                usagePeriod === 'day'
                  ? usage.apps.find((a) => a.id === app.id)
                  : undefined
              const primary = app.unlockedMinutes
              const max = Math.max(...appRows.map((a) => a.unlockedMinutes), 1)
              const pct = Math.min(100, (primary / max) * 100)
              return (
                <div key={app.id}>
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="text-white/70 truncate">{app.name}</span>
                    <span className="text-white/40 tabular-nums shrink-0">
                      {formatMinutes(primary)}
                      {showOsDayMetrics &&
                      daySource?.blockAttempts != null &&
                      daySource.blockAttempts > 0
                        ? ` · ${t('activity.blockAttemptsCount', { count: daySource.blockAttempts })}`
                        : ''}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${app.color}cc, ${app.color}66)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ActivityInsights() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { sessions, profile, apps, usageHistory } = useStore()
  const [period, setPeriod] = useState<StatsPeriod>('week')
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('day')
  const [usage, setUsage] = useState<UsageInsightsSnapshot | null>(null)
  const isPro = profile.isPro

  useEffect(() => {
    if (!isPro) return
    let cancelled = false
    void loadUsageInsights({
      apps,
      openingsUsedToday: profile.openingsUsedToday,
      openingsDate: profile.openingsDate,
    }).then((snapshot) => {
      if (!cancelled) setUsage(snapshot)
    })
    return () => {
      cancelled = true
    }
  }, [isPro, apps, profile.openingsUsedToday, profile.openingsDate])

  // Free: never mount Pro charts (avoids one-frame flash of locked content).
  if (!isPro) {
    return (
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {t('activity.insights')}
          </h2>
          <Badge variant="default">{t('common.free')}</Badge>
        </div>
        <div className="rounded-2xl px-6 py-8 bg-white/[0.03] border border-emerald-500/20 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Lock size={22} className="text-emerald-400" />
          </div>
          <h3 className="font-semibold mb-2">{t('activity.unlockInsights')}</h3>
          <p className="text-sm text-white/45 mb-5 leading-relaxed max-w-sm mx-auto">
            {t('activity.unlockInsightsDesc')}
          </p>
          <MotionButton
            fullWidth
            onClick={() => {
              void openUpgradeOrFallback(() => navigate('/pricing'))
            }}
          >
            <Sparkles size={16} />
            {t('common.upgrade')}
          </MotionButton>
        </div>
      </div>
    )
  }

  const comparison = getTodayVsYesterday(sessions)
  const periodStats = getPeriodStats(sessions, period)
  const totals = getPeriodTotals(periodStats)
  const categories = getCategoryBreakdown(sessions, (type) =>
    t(`categories.${EXERCISES[type as keyof typeof EXERCISES]?.category ?? 'cardio'}`)
  )
  const usagePeriodTotals = sumUsagePeriod(usageHistory, usagePeriod)
  const byAppRows = aggregateByAppForPeriod(usageHistory, usagePeriod)
  const chartMaxEarned = Math.max(...periodStats.map((d) => d.earnedMinutes), 0)
  // Scale with data; floor so empty/low days don’t look broken. No hard 80m cap.
  const chartYMax = Math.max(20, Math.ceil((chartMaxEarned * 1.15) / 5) * 5)

  const periodLabel = {
    week: t('activity.periodWeek'),
    month: t('activity.periodMonth'),
    year: t('activity.periodYear'),
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-2 mb-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          {t('activity.insights')}
        </h2>
        <Badge variant="pro">{t('common.pro')}</Badge>
      </div>

      <div className="relative">
        <UsageSection
          usage={usage}
          usagePeriod={usagePeriod}
          onPeriodChange={setUsagePeriod}
          periodTotals={usagePeriodTotals}
          byAppRows={byAppRows}
        />

        {/* Today vs Yesterday */}
        <div className="rounded-2xl p-5 mb-4 bg-white/[0.03] border border-white/[0.07]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-4 text-center">
            {t('activity.todayVsYesterday')}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-xs text-emerald-300 mb-1">{t('activity.todayLabel')}</p>
              <p className="text-2xl font-bold tabular-nums">{formatMinutes(comparison.today)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
              <p className="text-xs text-white/40 mb-1">{t('activity.yesterdayLabel')}</p>
              <p className="text-2xl font-bold text-white/70 tabular-nums">
                {formatMinutes(comparison.yesterday)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            {comparison.change >= 0 ? (
              <TrendingUp size={16} className="text-emerald-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
            <span className={comparison.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {comparison.change >= 0 ? '+' : ''}
              {formatMinutes(Math.abs(comparison.change))}
            </span>
            <span className="text-white/40">
              ({t('activity.change', { value: comparison.changePercent })})
            </span>
          </div>
          <p className="text-[10px] text-white/30 text-center mt-3">
            {t('activity.earnedComparisonNote')}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all',
                period === p
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-2xl p-4 mb-4 bg-white/[0.03] border border-white/[0.07] select-none">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 text-center">
            {t('activity.minutesEarned')}
          </p>
          <div className="h-48 chart-no-select outline-none focus:outline-none [&_*]:outline-none [&_svg]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodStats}
                margin={{ top: 8, right: 8, left: 4, bottom: period === 'year' ? 8 : 4 }}
                style={{ outline: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                tabIndex={-1}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: period === 'year' ? 10 : 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  tickLine={false}
                  interval={0}
                  minTickGap={period === 'year' ? 0 : 8}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}m`}
                  domain={[0, chartYMax]}
                  allowDataOverflow={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(27,138,94,0.08)' }} />
                <Bar dataKey="earnedMinutes" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {periodStats.map((entry, i) => (
                    <Cell
                      key={entry.date}
                      fill={i === periodStats.length - 1 ? '#1B8A5E' : 'rgba(27,138,94,0.35)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Period totals */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-2xl p-3 text-center bg-white/[0.03] border border-white/[0.07]">
            <p className="text-lg font-bold gradient-text tabular-nums">
              {formatMinutes(totals.totalEarned)}
            </p>
            <p className="text-[10px] text-white/40 uppercase mt-1 tracking-wider">
              {t('activity.totalEarned')}
            </p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-white/[0.03] border border-white/[0.07]">
            <p className="text-lg font-bold tabular-nums">{formatMinutes(totals.avgDaily)}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1 tracking-wider">
              {t('activity.avgDaily')}
            </p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-white/[0.03] border border-white/[0.07]">
            <p className="text-lg font-bold tabular-nums">
              {formatMinutes(totals.bestDay.earnedMinutes)}
            </p>
            <p className="text-[10px] text-white/40 uppercase mt-1 tracking-wider">
              {t('activity.bestDay')}
            </p>
          </div>
        </div>

        {/* Category split */}
        {categories.length > 0 && (
          <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3 text-center">
              {t('activity.categorySplit')}
            </p>
            <div className="space-y-2">
              {categories.map((cat) => {
                const max = categories[0]?.minutes ?? 1
                const pct = (cat.minutes / max) * 100
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{cat.category}</span>
                      <span className="text-white/40 tabular-nums">{formatMinutes(cat.minutes)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
