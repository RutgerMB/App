import { useState, useEffect } from 'react'
import { Search, Loader2, Smartphone, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { AppBrandIcon } from '@/components/AppBrandIcon'
import {
  getDeviceApps,
  canPickInstalledApps,
  usesIosActivityPicker,
  openIosActivityPicker,
  ensureIosAuthorization,
} from '@/lib/device-apps'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { useTranslation } from '@/i18n/context'

interface DeviceAppPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (app: DeviceAppDefinition) => void
  excludeIds: string[]
}

export function DeviceAppPicker({ open, onClose, onSelect, excludeIds }: DeviceAppPickerProps) {
  const { t } = useTranslation()
  const [apps, setApps] = useState<DeviceAppDefinition[]>([])
  const installedOnly = canPickInstalledApps()
  const onIos = usesIosActivityPicker()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSearch('')
    getDeviceApps()
      .then(setApps)
      .finally(() => setLoading(false))
  }, [open])

  const handleIosPick = async () => {
    setPickerLoading(true)
    try {
      const authorized = await ensureIosAuthorization()
      if (!authorized) return
      const picked = await openIosActivityPicker()
      setApps(picked)
    } finally {
      setPickerLoading(false)
    }
  }

  const filtered = apps.filter((app) => {
    if (excludeIds.includes(app.id) || excludeIds.includes(app.packageName ?? '')) return false
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <Modal open={open} onClose={onClose} title={t('apps.chooseFromDevice')} position="center" className="max-h-[80dvh]">
      <p className="text-sm text-white/45 mb-4 -mt-2">
        {installedOnly
          ? t('apps.deviceAppsNative')
          : onIos
            ? t('apps.iosPickAppsHint')
            : t('apps.deviceAppsWeb')}
      </p>

      {onIos ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void handleIosPick()}
            disabled={pickerLoading}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-sm hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
          >
            {pickerLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {t('apps.iosPickAppsButton')}
          </button>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-white/40 py-8 text-sm">{t('apps.iosNoAppsPicked')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pb-2">
              {filtered.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    onSelect(app)
                    onClose()
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-2 border border-border hover:border-indigo-500/40 hover:bg-surface-3 transition-all"
                >
                  <AppBrandIcon brand={app.brand} name={app.name} color={app.color} size="md" />
                  <span className="text-[11px] font-medium text-white/70 text-center line-clamp-2 leading-tight">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : installedOnly ? (
        <>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="search"
              placeholder={t('apps.searchApps')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-3 border border-border text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-white/40 py-12 text-sm">{t('apps.noInstalledApps')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pb-2">
              {filtered.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    onSelect(app)
                    onClose()
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-2 border border-border hover:border-indigo-500/40 hover:bg-surface-3 transition-all"
                >
                  <AppBrandIcon brand={app.brand} name={app.name} color={app.color} size="md" />
                  <span className="text-[11px] font-medium text-white/70 text-center line-clamp-2 leading-tight">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-white/40 py-12 text-sm">{t('apps.noAppsFound')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pb-2">
          {filtered.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                onSelect(app)
                onClose()
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-2 border border-border hover:border-indigo-500/40 hover:bg-surface-3 transition-all"
            >
              <AppBrandIcon brand={app.brand} name={app.name} color={app.color} size="md" />
              <span className="text-[11px] font-medium text-white/70 text-center line-clamp-2 leading-tight">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
