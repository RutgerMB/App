import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Grid3X3, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

const hiddenNavRoutes = ['/onboarding', '/exercise/session', '/exercise/workout', '/exercise/category', '/pricing', '/success', '/cancel']

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-4 mb-3">
        <div className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
                  isActive
                    ? 'text-white bg-white/8'
                    : 'text-white/35 hover:text-white/60'
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
  )
}
