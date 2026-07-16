import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function AppShell({ children, className, noPadding }: AppShellProps) {
  return (
    <div className="min-h-dvh min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-surface-0 noise relative">
      {/* Full-bleed ambient layer — extends under status bar */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-surface-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-56 bg-indigo-500/[0.12] rounded-full blur-3xl" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-violet-500/6 rounded-full blur-3xl" />
      </div>
      <main
        className={`relative z-10 w-full max-w-full overflow-x-hidden ${
          noPadding
            ? ''
            : 'px-5 pt-5 safe-top pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))]'
        } ${className ?? ''}`}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
