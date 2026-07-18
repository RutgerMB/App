import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useNavigate } from 'react-router-dom'
import { consumeIosShieldHandoff } from '@/lib/replock-controls'
import { usesIosActivityPicker } from '@/lib/device-apps'
import { useStore } from '@/store'

/**
 * When the user taps "Earn minutes" on a blocked-app shield, Shield Action cannot
 * open RepLock (Apple). It sets an App Group flag; we route to Exercise on resume.
 */
export function ShieldHandoffSync() {
  const navigate = useNavigate()
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)

  useEffect(() => {
    if (!usesIosActivityPicker() || !onboardingComplete) return

    const check = async () => {
      const pending = await consumeIosShieldHandoff()
      if (pending) navigate('/exercise')
    }

    void check()

    if (!Capacitor.isNativePlatform()) return

    let handle: { remove: () => Promise<void> } | undefined
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void check()
    }).then((h) => {
      handle = h
    })

    return () => {
      void handle?.remove()
    }
  }, [navigate, onboardingComplete])

  return null
}
