import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized)
  const initAuth = useAuthStore((s) => s.initAuth)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initAuth().catch((err) => {
      console.error('Auth init failed:', err)
      setError(err instanceof Error ? err.message : 'Auth failed')
    })
  }, [initAuth])

  if (!initialized) {
    return (
      <div className="min-h-dvh bg-surface-0 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-indigo-400 animate-spin" />
        {error && <p className="text-sm text-red-400/80 px-6 text-center">{error}</p>}
      </div>
    )
  }

  return <>{children}</>
}
