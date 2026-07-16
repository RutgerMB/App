import Foundation

/// Keys shared between the DeviceActivityReport extension and RepLockControls.
/// Keep string values identical in both targets (no shared framework yet).
enum ScreenTimeSharedKeys {
    static let appGroupId = "group.com.replock.fitness"
    /// Opaque context string — must match host `DeviceActivityReport.Context`.
    static let reportContextRawValue = "RepLock.TotalActivity"
    static let totalMinutesKey = "replock.dailyScreenTime.totalMinutes"
    static let dayKey = "replock.dailyScreenTime.day"
    static let updatedAtKey = "replock.dailyScreenTime.updatedAt"
}

enum ScreenTimeSharedStore {
    private static var defaults: UserDefaults? {
        UserDefaults(suiteName: ScreenTimeSharedKeys.appGroupId)
    }

    static func dayString(for date: Date = Date(), calendar: Calendar = .current) -> String {
        let comps = calendar.dateComponents([.year, .month, .day], from: date)
        let y = comps.year ?? 0
        let m = comps.month ?? 0
        let d = comps.day ?? 0
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    /// Persist today's total screen time (minutes) for the main app to read.
    static func writeTodayTotalMinutes(_ minutes: Int, at date: Date = Date()) {
        guard let defaults else { return }
        let clamped = max(0, minutes)
        defaults.set(clamped, forKey: ScreenTimeSharedKeys.totalMinutesKey)
        defaults.set(dayString(for: date), forKey: ScreenTimeSharedKeys.dayKey)
        defaults.set(date.timeIntervalSince1970, forKey: ScreenTimeSharedKeys.updatedAtKey)
    }

    struct Snapshot {
        let totalMinutes: Int
        let day: String
        let updatedAt: Date

        var hours: Double {
            Double(totalMinutes) / 60.0
        }

        var hoursComponent: Int {
            totalMinutes / 60
        }

        var minutesComponent: Int {
            totalMinutes % 60
        }

        func isForToday(calendar: Calendar = .current) -> Bool {
            day == ScreenTimeSharedStore.dayString(calendar: calendar)
        }
    }

    static func readSnapshot() -> Snapshot? {
        guard let defaults else { return nil }
        guard defaults.object(forKey: ScreenTimeSharedKeys.totalMinutesKey) != nil else {
            return nil
        }
        let minutes = defaults.integer(forKey: ScreenTimeSharedKeys.totalMinutesKey)
        guard let day = defaults.string(forKey: ScreenTimeSharedKeys.dayKey), !day.isEmpty else {
            return nil
        }
        let updated = defaults.double(forKey: ScreenTimeSharedKeys.updatedAtKey)
        let updatedAt = updated > 0 ? Date(timeIntervalSince1970: updated) : Date.distantPast
        return Snapshot(totalMinutes: max(0, minutes), day: day, updatedAt: updatedAt)
    }

    static func readTodaySnapshot() -> Snapshot? {
        guard let snap = readSnapshot(), snap.isForToday() else { return nil }
        return snap
    }
}
