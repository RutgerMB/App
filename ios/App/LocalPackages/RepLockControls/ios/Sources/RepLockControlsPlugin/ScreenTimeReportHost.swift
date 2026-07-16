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
    private static let pollIntervalNs: UInt64 = 250_000_000
    /// First report after authorize can take several seconds on device.
    private static let timeout: TimeInterval = 12.0

    @MainActor
    static func refresh(from presenter: UIViewController?, force: Bool = false) async -> ScreenTimeSharedStore.Snapshot? {
        if !force, let cached = ScreenTimeSharedStore.readTodaySnapshot(), cached.isFresh() {
            return cached
        }

        let baselineUpdatedAt = ScreenTimeSharedStore.readSnapshot()?.updatedAt ?? .distantPast

        guard let parent = presenter else {
            // Still allow a short wait for an extension write that may already be in flight.
            return await pollForSnapshot(baselineUpdatedAt: baselineUpdatedAt, force: force, timeout: 3.0)
        }

        let host = UIHostingController(rootView: ScreenTimeReportProbeView())
        host.view.backgroundColor = .clear
        host.view.isUserInteractionEnabled = false
        host.view.frame = CGRect(x: 0, y: 0, width: 2, height: 2)
        host.view.alpha = 0.01

        parent.addChild(host)
        parent.view.addSubview(host.view)
        host.didMove(toParent: parent)

        let latest = await pollForSnapshot(
            baselineUpdatedAt: baselineUpdatedAt,
            force: force,
            timeout: timeout
        )

        host.willMove(toParent: nil)
        host.view.removeFromSuperview()
        host.removeFromParent()

        return latest ?? ScreenTimeSharedStore.readTodaySnapshot()
    }

    @MainActor
    private static func pollForSnapshot(
        baselineUpdatedAt: Date,
        force: Bool,
        timeout: TimeInterval
    ) async -> ScreenTimeSharedStore.Snapshot? {
        let deadline = Date().addingTimeInterval(timeout)
        var latest = ScreenTimeSharedStore.readTodaySnapshot()

        while Date() < deadline {
            if let snap = ScreenTimeSharedStore.readTodaySnapshot() {
                let isNew = snap.updatedAt > baselineUpdatedAt
                let usable = force ? isNew || snap.isFresh(maxAge: 300) : (isNew || snap.isFresh())
                if usable {
                    return snap
                }
                latest = snap
            }
            try? await Task.sleep(nanoseconds: pollIntervalNs)
        }

        return latest ?? ScreenTimeSharedStore.readTodaySnapshot()
    }
}
