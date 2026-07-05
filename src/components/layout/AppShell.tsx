import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function AppShell({ children, className, noPadding }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-surface-0 noise relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-violet-500/6 rounded-full blur-3xl" />
      </div>
      <main className={`relative z-10 ${noPadding ? '' : 'px-5 pt-5 pb-28 safe-top'} ${className ?? ''}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
