import Foundation

/// Keys shared with `RepLockDeviceActivityReport` (keep string values identical).
enum ScreenTimeSharedKeys {
    static let appGroupId = "group.com.replock.fitness"
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

    struct Snapshot {
        let totalMinutes: Int
        let day: String
        let updatedAt: Date

        var hours: Double { Double(totalMinutes) / 60.0 }
        var hoursComponent: Int { totalMinutes / 60 }
        var minutesComponent: Int { totalMinutes % 60 }

        func isForToday(calendar: Calendar = .current) -> Bool {
            day == ScreenTimeSharedStore.dayString(calendar: calendar)
        }

        /// Fresh enough to skip re-hosting the report (saves work on rapid JS polls).
        func isFresh(maxAge: TimeInterval = 60) -> Bool {
            isForToday() && Date().timeIntervalSince(updatedAt) <= maxAge
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
