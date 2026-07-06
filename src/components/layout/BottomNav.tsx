import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Grid3X3, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

const hiddenNavRoutes = ['/welcome', '/onboarding', '/exercise/session', '/exercise/workout', '/exercise/category', '/pricing', '/success', '/cancel', '/login', '/register']

export function BottomNav() {
  const location = useLocation()
  const { t } = useTranslation()
  const hidden = hiddenNavRoutes.some((r) => location.pathname.startsWith(r))

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/exercise', icon: Dumbbell, label: t('nav.exercise') },
    { to: '/apps', icon: Grid3X3, label: t('nav.apps') },
    { to: '/activity', icon: Activity, label: t('nav.activity') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  if (hidden) return null

  return (
    <>
      {/* Opaque backdrop — Android WebView doesn't render glass blur reliably */}
      <div
        className="fixed bottom-0 inset-x-0 z-[39] bg-surface-0 border-t border-white/[0.08] pointer-events-none"
        style={{ height: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden
      />
      <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom">
        <div className="mx-3 mb-2">
          <div className="bg-surface-2 border border-white/[0.08] rounded-2xl px-2 py-2 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 min-w-[56px]',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/40 hover:text-white/65'
                  )
                }
              >
                <Icon size={20} strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
