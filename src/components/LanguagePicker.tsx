import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { LOCALES, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

const SORTED_LOCALES = [...LOCALES].sort((a, b) => a.label.localeCompare(b.label))

interface LanguageDropdownProps {
  value: Locale
  onChange: (locale: Locale) => void
}

export function LanguageDropdown({ value, onChange }: LanguageDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const selected = SORTED_LOCALES.find((l) => l.code === value) ?? SORTED_LOCALES[0]

  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      const menu = document.getElementById('language-dropdown-menu')
      if (menu?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const menu = open
    ? createPortal(
        <div
          id="language-dropdown-menu"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          className="fixed z-[200] py-1 rounded-xl bg-surface-2 border border-border shadow-2xl shadow-black/50 max-h-60 overflow-y-auto"
        >
          {SORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => {
                onChange(loc.code)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors',
                value === loc.code && 'bg-indigo-500/10'
              )}
            >
              <span className="text-lg">{loc.flag}</span>
              <span className="flex-1 font-medium">{loc.label}</span>
              {value === loc.code && <Check size={14} className="text-indigo-400" />}
            </button>
          ))}
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 h-12 px-4 rounded-xl bg-surface-3 border border-border hover:border-border-hover transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-lg">{selected.flag}</span>
          <span className="text-sm font-medium">{selected.label}</span>
        </span>
        <ChevronDown size={16} className={cn('text-white/40 transition-transform', open && 'rotate-180')} />
      </button>
      {menu}
    </>
  )
}

export function LanguagePicker({ value, onChange, className }: LanguageDropdownProps & { className?: string }) {
  const sorted = [...LOCALES].sort((a, b) => a.label.localeCompare(b.label))
  return (
    <div className={cn('grid grid-cols-1 gap-2', className)}>
      {sorted.map((loc) => (
        <button
          key={loc.code}
          onClick={() => onChange(loc.code)}
          className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border transition-all text-left',
            value === loc.code
              ? 'bg-indigo-500/15 border-indigo-500/40'
              : 'bg-surface-2 border-border hover:border-border-hover'
          )}
        >
          <span className="text-2xl">{loc.flag}</span>
          <span className="font-medium text-sm">{loc.label}</span>
          {value === loc.code && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />}
        </button>
      ))}
    </div>
  )
}
