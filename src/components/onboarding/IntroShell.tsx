import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IntroShellProps {
  children: ReactNode
  footer?: ReactNode
  variant?: 'hero' | 'setup' | 'auth'
  className?: string
}

/** RepLock-themed shell for welcome, auth, and onboarding flows. */
export function IntroShell({ children, footer, variant = 'hero', className }: IntroShellProps) {
  return (
    <div className={cn('min-h-dvh flex flex-col safe-top safe-bottom overflow-hidden bg-surface-0 noise', className)}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 w-[28rem] h-80 rounded-full blur-3xl',
            variant === 'hero' ? 'bg-indigo-500/20' : 'bg-indigo-500/12'
          )}
        />
        {variant === 'hero' && (
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        )}
      </div>
      <div className="relative flex-1 flex flex-col px-6 pt-6 pb-8 text-white">{children}</div>
      {footer && <div className="relative shrink-0 px-6 pb-8 safe-bottom">{footer}</div>}
    </div>
  )
}

export function IntroProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.max(6, (step / total) * 100))
  return (
    <div className="h-1 w-[7.5rem] mx-auto rounded-full bg-white/10 overflow-hidden mb-6">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
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
            i === active ? 'w-2.5 h-2.5 bg-indigo-400' : 'w-2 h-2 bg-white/20'
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
        'bg-gradient-to-r from-indigo-500 to-violet-600 text-white',
        'shadow-lg shadow-indigo-500/25 hover:brightness-110 disabled:opacity-50'
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
      className="w-full h-14 rounded-2xl bg-surface-2 border border-border text-white text-base font-semibold flex items-center justify-center gap-3 hover:bg-surface-3 hover:border-indigo-500/30 active:scale-[0.99] transition-all"
    >
      {icon}
      {children}
    </button>
  )
}

export function IntroHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-2xl sm:text-3xl font-bold text-center leading-tight text-white', className)}>
      {children}
    </h2>
  )
}

export function IntroSubtext({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-white/50 text-center text-sm sm:text-base leading-relaxed', className)}>{children}</p>
}
