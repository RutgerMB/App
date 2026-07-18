# RepLock Shield extensions

Apple shows a **system shield** when a user opens an app that `ManagedSettingsStore.shield` is blocking. Two app extensions customize that UI:

| Target | Role | Extension point |
|--------|------|-----------------|
| `RepLockShieldConfiguration` | Title, subtitle, icon, button labels | `com.apple.ManagedSettingsUI.shield-configuration-service` |
| `RepLockShieldAction` | What happens when a button is tapped | `com.apple.ManagedSettingsUI.shield-action-service` |

## Bundle IDs

- `app.replock.bleeker.RepLockShieldConfiguration`
- `app.replock.bleeker.RepLockShieldAction`

## What we brand

- Title: **RepLock**
- Subtitle: earn screen time by working out
- Primary button: **Earn minutes** (writes App Group handoff flag, then closes shield)
- Secondary: **Close**
- Icon: asset `ShieldLogo` if you add it to the configuration target; otherwise SF Symbol `lock.shield.fill`

## Honest limitation (Apple)

There is **no supported API** for a Shield Action extension to `openURL` / deep-link into the containing app. Apps that appear to do this use undocumented behavior that can break. RepLock’s action:

1. Sets `replock.shield.pendingEarnMinutes` in `group.com.replock.fitness`
2. Returns `.close`
3. The main app should read that flag on foreground and navigate to Exercise (optional JS bridge — see IOS_SETUP.md)

## Mac setup

See **IOS_SETUP.md → Shield Configuration & Action extensions**. Sources live here; Xcode targets must be added on Mac (same pattern as DeviceActivityReport).
