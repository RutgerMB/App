import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IntroShellProps {
  children: ReactNode
  footer?: ReactNode
  variant?: 'hero' | 'setup' | 'auth'
  className?: string
}

/**
 * Full-viewport shell for welcome / auth / onboarding.
 * Uses an explicit scrollport (not body scroll) — required for reliable touch
 * scrolling inside Capacitor Android WebViews.
 */
export function IntroShell({ children, footer, variant = 'hero', className }: IntroShellProps) {
  return (
    <div
      className={cn(
        'h-[100dvh] max-h-[100dvh] w-full flex flex-col safe-top safe-bottom overflow-hidden bg-surface-0 noise',
        className
      )}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className={cn(
            'absolute -top-8 left-1/2 -translate-x-1/2 w-[30rem] h-96 rounded-full blur-3xl',
            variant === 'hero' ? 'bg-emerald-500/22' : 'bg-emerald-500/14'
          )}
        />
        {variant !== 'auth' && (
          <div className="absolute bottom-[18%] right-[-10%] w-72 h-72 bg-teal-600/10 rounded-full blur-3xl" />
        )}
        {variant === 'setup' && (
          <div className="absolute top-1/3 left-[-15%] w-56 h-56 bg-cyan-500/5 rounded-full blur-3xl" />
        )}
      </div>

      <div
        data-intro-scroll
        className="relative flex-1 min-h-0 overflow-y-scroll overscroll-y-contain px-5 pt-5 pb-6 text-white"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>

      {footer && (
        <div className="relative z-10 shrink-0 px-5 pb-6 pt-3 safe-bottom border-t border-white/[0.06] bg-surface-0">
          {footer}
        </div>
      )}
    </div>
  )
}

export function IntroBackButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mb-3 self-start -ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-white/45 hover:text-white/85 hover:bg-white/[0.05] transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="font-medium">{label}</span>
    </button>
  )
}

export function IntroProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.max(8, (step / total) * 100))
  return (
    <div className="w-full max-w-[10rem] mx-auto mb-7">
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out shadow-sm shadow-emerald-500/40"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-white/25 text-center mt-2 tabular-nums">
        {step}/{total}
      </p>
    </div>
  )
}

export function IntroBrandMark({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70 text-center mb-3',
        className
      )}
    >
      RepLock
    </p>
  )
}

export function IntroDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === active ? 'w-2.5 h-2.5 bg-emerald-400' : 'w-2 h-2 bg-white/20'
          )}
        />
      ))}
    </div>
  )
}

export function IntroPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full h-14 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]',
        'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
        'shadow-lg shadow-emerald-500/25 hover:brightness-110 disabled:opacity-50'
      )}
    >
      {children}
    </button>
  )
}

export function IntroAuthButton({
  children,
  onClick,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white text-base font-semibold flex items-center justify-center gap-3 hover:bg-white/[0.055] hover:border-emerald-500/30 active:scale-[0.99] transition-all"
    >
      {icon}
      {children}
    </button>
  )
}

export function IntroHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'text-[1.65rem] sm:text-3xl font-bold text-center leading-[1.15] tracking-tight text-white',
        className
      )}
    >
      {children}
    </h2>
  )
}

export function IntroSubtext({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-white/45 text-center text-sm sm:text-[15px] leading-relaxed', className)}>
      {children}
    </p>
  )
}
