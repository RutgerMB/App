import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

/**
 * Main tab shell. Document scroll is locked on Capacitor (see index.css);
 * this scrollport is what actually moves — required on Android WebView.
 */
export function AppShell({ children, className, noPadding }: AppShellProps) {
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-surface-0 noise relative flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-surface-0" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-56 bg-emerald-500/[0.12] rounded-full blur-3xl" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-teal-500/6 rounded-full blur-3xl" />
      </div>

      <main
        data-app-scroll
        className={cn(
          'relative z-10 flex-1 min-h-0 w-full max-w-full overflow-y-scroll overscroll-contain',
          noPadding
            ? ''
            : 'px-5 pt-5 safe-top pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))]',
          className
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
