# RepLock DeviceActivityReport extension

Swift sources + entitlements for the **Device Activity Report** app extension.

## Bundle ID

`app.replock.bleeker.DeviceActivityReport`

## Why this exists

Apple does not expose OS Screen Time totals to the main app process. A Device Activity Report extension receives `DeviceActivityResults`, sums today's duration, and writes:

| Key | Suite |
|-----|--------|
| `replock.dailyScreenTime.totalMinutes` | `group.com.replock.fitness` |
| `replock.dailyScreenTime.day` | `group.com.replock.fitness` |
| `replock.dailyScreenTime.updatedAt` | `group.com.replock.fitness` |

`RepLockControls.getDailyScreenTimeHours` hosts a tiny `DeviceActivityReport` view, then reads those keys.

## Add the target in Xcode (required on Mac)

This folder is **not** wired into `project.pbxproj` from Windows. Follow **IOS_SETUP.md → DeviceActivityReport extension**.

Summary:

1. File → New → Target → **Device Activity Report Extension**
2. Product Name: `RepLockDeviceActivityReport`
3. Bundle ID: `app.replock.bleeker.DeviceActivityReport`
4. Replace template files with the Swift sources in this folder (or point the target at this folder)
5. Signing: same Team as App; entitlements = this folder’s `.entitlements`
6. Capabilities: Family Controls + App Group `group.com.replock.fitness`
7. Embed in App target (Embed Foundation Extensions / PlugIns)

## DeviceActivityMonitor

Not required for reading daily totals. Add later when enforcing schedules / thresholds (shields on schedule).
