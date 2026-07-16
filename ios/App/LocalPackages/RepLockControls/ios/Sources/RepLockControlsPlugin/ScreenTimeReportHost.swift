import DeviceActivity
import Foundation
import SwiftUI
import UIKit

@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
    /// Must match the DeviceActivityReport extension scene context string.
    static let repLockTotalActivity = Self(ScreenTimeSharedKeys.reportContextRawValue)
}

@available(iOS 16.0, *)
private struct ScreenTimeReportProbeView: View {
    private var todayFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let now = Date()
        let interval = calendar.dateInterval(of: .day, for: now)
            ?? DateInterval(start: calendar.startOfDay(for: now), end: now)
        return DeviceActivityFilter(segment: .daily(during: interval))
    }

    var body: some View {
        DeviceActivityReport(.repLockTotalActivity, filter: todayFilter)
            .frame(width: 2, height: 2)
            .opacity(0.01)
            .accessibilityHidden(true)
    }
}

/// Hosts a tiny `DeviceActivityReport` so the report extension can run and write App Group totals.
@available(iOS 16.0, *)
enum ScreenTimeReportHost {
    private static let pollIntervalNs: UInt64 = 200_000_000
    private static let timeout: TimeInterval = 4.0

    @MainActor
    static func refresh(from presenter: UIViewController?, force: Bool = false) async -> ScreenTimeSharedStore.Snapshot? {
        if !force, let cached = ScreenTimeSharedStore.readTodaySnapshot(), cached.isFresh() {
            return cached
        }

        let baselineUpdatedAt = ScreenTimeSharedStore.readSnapshot()?.updatedAt ?? .distantPast

        guard let parent = presenter else {
            return ScreenTimeSharedStore.readTodaySnapshot()
        }

        let host = UIHostingController(rootView: ScreenTimeReportProbeView())
        host.view.backgroundColor = .clear
        host.view.isUserInteractionEnabled = false
        host.view.frame = CGRect(x: 0, y: 0, width: 2, height: 2)
        host.view.alpha = 0.01

        parent.addChild(host)
        parent.view.addSubview(host.view)
        host.didMove(toParent: parent)

        let deadline = Date().addingTimeInterval(timeout)
        var latest = ScreenTimeSharedStore.readTodaySnapshot()

        while Date() < deadline {
            if let snap = ScreenTimeSharedStore.readTodaySnapshot(),
               snap.updatedAt > baselineUpdatedAt || (force == false && snap.isFresh()) {
                latest = snap
                break
            }
            try? await Task.sleep(nanoseconds: pollIntervalNs)
            latest = ScreenTimeSharedStore.readTodaySnapshot() ?? latest
        }

        host.willMove(toParent: nil)
        host.view.removeFromSuperview()
        host.removeFromParent()

        return latest ?? ScreenTimeSharedStore.readTodaySnapshot()
    }
}
