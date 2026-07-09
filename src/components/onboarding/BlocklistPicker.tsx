import { useEffect, useMemo, useState, useCallback } from 'react'
import { Search, Check, Smartphone, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { AppIcon } from '@/components/AppBrandIcon'
import {
  getDeviceApps,
  canPickInstalledApps,
  usesIosActivityPicker,
  pickIosAppsWithAuth,
} from '@/lib/device-apps'
import { groupAppsByCategory, DEVICE_APPS, type DeviceAppDefinition } from '@/data/device-apps'
import { useToast } from '@/components/ui/Toast'

const CATEGORY_EMOJI: Record<string, string> = {
  social: '💬',
  entertainment: '🍿',
  games: '🎮',
  productivity: '📱',
  shopping: '🛍️',
  other: '📦',
}

export function BlocklistPicker({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [apps, setApps] = useState<DeviceAppDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)
  const onIos = usesIosActivityPicker()

  const refreshApps = useCallback(async () => {
    setLoading(true)
    const list = await getDeviceApps()
    setApps(list)
    setLoading(false)
    if (onIos && list.length > 0) {
      onChange(new Set(list.map((a) => a.id)))
    }
  }, [onChange, onIos])

  useEffect(() => {
    void refreshApps()
  }, [refreshApps])

  const handleIosPick = async () => {
    setPickerLoading(true)
    try {
      const result = await pickIosAppsWithAuth()
      if (!result.ok) {
        const key = `apps.iosPickError_${result.reason}` as const
        const msg = t(key as 'apps.iosPickError_denied')
        toast(msg !== key ? msg : t('apps.iosPickError_failed'), 'error')
        return
      }
      setApps(result.apps)
      if (result.apps.length > 0) {
        onChange(new Set(result.apps.map((a) => a.id)))
      } else {
        toast(t('apps.iosNoAppsPicked'), 'info')
      }
    } catch {
      toast(t('apps.iosPickError_failed'), 'error')
    } finally {
      setPickerLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return apps
    return apps.filter((a) => a.name.toLowerCase().includes(q))
  }, [apps, query])

  const groups = useMemo(() => groupAppsByCategory(filtered), [filtered])

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      if (next.size > 1) next.delete(id)
    } else {
      next.add(id)
    }
    onChange(next)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Loader2 size={28} className="animate-spin mb-3" />
        <p className="text-sm">{t('onboarding.blocklistLoading')}</p>
      </div>
    )
  }

  if (onIos) {
    return (
      <div className="flex flex-col -mx-1">
        <p className="text-xs text-white/50 mb-4 leading-relaxed">{t('apps.iosPickAppsHint')}</p>

        <button
          type="button"
          onClick={() => void handleIosPick()}
          disabled={pickerLoading}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-sm mb-4 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
        >
          {pickerLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {apps.length > 0 ? t('apps.iosPickAppsAgain') : t('apps.iosPickAppsButton')}
        </button>

        {apps.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden mb-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0"
              >
                <AppIcon brand={app.brand} name={app.name} color={app.color} icon="" size="sm" />
                <span className="flex-1 text-sm font-medium truncate">{app.name}</span>
                <Check size={16} className="text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-1 py-2 px-4 rounded-full bg-surface-2 border border-border text-xs text-white/45">
          <Smartphone size={14} />
          <span>{t('onboarding.blocklistSelected', { count: apps.length })}</span>
        </div>
      </div>
    )
  }

  const catalog = apps.length > 0 ? apps : DEVICE_APPS

  return (
    <div className="flex flex-col -mx-1">
      {!canPickInstalledApps() && (
        <p className="text-xs text-white/40 mb-3 leading-relaxed">{t('onboarding.blocklistWebHint')}</p>
      )}

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('onboarding.blocklistSearch')}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-2 border border-border text-sm text-white placeholder:text-white/30"
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden max-h-[min(52vh,420px)] overflow-y-auto">
        {groupAppsByCategory(filtered.length > 0 ? filtered : catalog).map((group) => (
          <div key={group.category}>
            <div className="sticky top-0 z-10 px-4 py-2 bg-surface-3/95 border-b border-border backdrop-blur-sm">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                {t(`onboarding.categories.${group.category}`)}
              </p>
            </div>
            {group.apps.map((app) => {
              const isSelected = selected.has(app.id)
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => toggle(app.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0 text-left transition-colors',
                    isSelected ? 'bg-indigo-500/10' : 'hover:bg-surface-3/50'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-white/25'
                    )}
                  >
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-lg w-7 text-center shrink-0">{CATEGORY_EMOJI[app.category] ?? '📱'}</span>
                  <AppIcon brand={app.brand} name={app.name} color={app.color} icon="" size="sm" />
                  <span className="flex-1 text-sm font-medium truncate">{app.name}</span>
                </button>
              )
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-white/40 text-center py-10">{t('onboarding.blocklistEmpty')}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 py-2 px-4 rounded-full bg-surface-2 border border-border text-xs text-white/45">
        <Smartphone size={14} />
        <span>{t('onboarding.blocklistSelected', { count: selected.size })}</span>
      </div>
    </div>
  )
}

export function resolveSelectedApps(ids: Set<string>, catalog: DeviceAppDefinition[]): DeviceAppDefinition[] {
  return catalog.filter((a) => ids.has(a.id))
}
