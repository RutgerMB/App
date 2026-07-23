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
                value === loc.code && 'bg-emerald-500/10'
              )}
            >
              <span className="text-lg">{loc.flag}</span>
              <span className="flex-1 font-medium">{loc.label}</span>
              {value === loc.code && <Check size={14} className="text-emerald-400" />}
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

export function LanguagePicker({
  value,
  onChange,
  className,
  large,
  theme = 'dark',
}: LanguageDropdownProps & { className?: string; large?: boolean; theme?: 'dark' | 'light' }) {
  // Keep a stable display order so gaps stay visually even (don't locale-sort at runtime).
  const ordered = LOCALES
  const isLight = theme === 'light'
  return (
    <div
      className={cn(
        'flex flex-col w-full',
        // Explicit spacing — same between every pair of rows
        large ? 'gap-3' : 'gap-2',
        className
      )}
    >
      {ordered.map((loc) => {
        const selected = value === loc.code
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => onChange(loc.code)}
            className={cn(
              // Fixed row height so flag emoji metrics can't change vertical gaps
              'box-border flex items-center w-full rounded-2xl border transition-all text-left shrink-0',
              large ? 'h-[4.25rem] px-5 gap-4' : 'h-14 px-4 gap-3',
              selected
                ? isLight
                  ? 'bg-[#3B6FF5]/10 border-[#3B6FF5]/35'
                  : 'bg-emerald-500/15 border-emerald-500/40'
                : isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                  : 'bg-surface-2 border-border hover:border-border-hover'
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center shrink-0 overflow-hidden leading-none',
                large ? 'w-10 h-10 text-[1.75rem]' : 'w-8 h-8 text-xl'
              )}
              aria-hidden
            >
              {loc.flag}
            </span>
            <span
              className={cn(
                'font-medium truncate flex-1 min-w-0 leading-none',
                large ? 'text-lg' : 'text-sm'
              )}
            >
              {loc.label}
            </span>
            <span
              className={cn(
                'rounded-full shrink-0',
                large ? 'w-2.5 h-2.5' : 'w-2 h-2',
                selected ? 'bg-emerald-400' : 'bg-transparent'
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
