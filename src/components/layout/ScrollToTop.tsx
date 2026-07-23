import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll position when switching routes (e.g. bottom tabs). */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    // App/Intro shells own the scrollport on Capacitor (document is locked).
    document.querySelectorAll<HTMLElement>('[data-app-scroll], [data-intro-scroll]').forEach((el) => {
      el.scrollTop = 0
    })
  }, [pathname])

  return null
}
