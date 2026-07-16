# RepLock DeviceActivityReport extension

Swift sources + entitlements for the **Device Activity Report** app extension.

## Bundle ID

`app.replock.bleeker.RepLockDeviceActivityReport` (must match Xcode + Apple Developer App ID)

## Why this exists

Apple does not expose OS Screen Time totals to the main app process as readable numbers. A Device Activity Report extension receives `DeviceActivityResults`, sums today's duration, and **renders** the total in its SwiftUI view (`TotalActivityView`).

| Key | Suite | Notes |
|-----|--------|--------|
| `replock.dailyScreenTime.totalMinutes` | `group.com.replock.fitness` | Best-effort; **silently dropped on device** by DAR sandbox |
| `replock.dailyScreenTime.day` | `group.com.replock.fitness` | Same |
| `replock.dailyScreenTime.updatedAt` | `group.com.replock.fitness` | Same |

`RepLockControls.getDailyScreenTimeHours` hosts an on-screen `DeviceActivityReport` and tries to read those keys (often works on Simulator only).

`RepLockControls.presentDailyScreenTimeReport` presents a sheet so the user can see today's total on a physical iPhone (supported path).

Context string (host + extension): **`RepLock.TotalActivity`**

## Mac checks

1. Target embedded: App → Build Phases → **Embed ExtensionKit Extensions** → `RepLockDeviceActivityReport.appex`
2. App Group `group.com.replock.fitness` on **App** and **RepLockDeviceActivityReport**
3. Family Controls on both
4. Run **App** scheme on a physical iPhone (not the appex alone)
5. Clean rebuild after pulling latest `TotalActivityReport` / host presentation fixes

See **IOS_SETUP.md → DeviceActivityReport extension**.

## DeviceActivityMonitor

Not required for displaying daily totals. Add later when enforcing schedules / thresholds (shields on schedule).
