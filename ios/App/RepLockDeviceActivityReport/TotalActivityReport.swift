//
//  TotalActivityReport.swift
//  RepLockDeviceActivityReport
//
//  DeviceActivityReport scene that averages daily activity over the last 7 days
//  (Apple's max interval for `.daily` segments) and writes minutes into the
//  App Group for the main app (RepLockControls probe) to read.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
    /// Must match `ScreenTimeSharedKeys.reportContextRawValue` in the host app.
    static let repLockTotalActivity = Self(ScreenTimeSharedKeys.reportContextRawValue)
}

enum ScreenTimeWindow {
    /// Apple `DeviceActivityFilter.Segment.daily` allows at most 7 days.
    static let dayCount = 7
}

struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .repLockTotalActivity
    let content: (String) -> TotalActivityView

    func makeConfiguration(
        representing data: DeviceActivityResults<DeviceActivityData>
    ) async -> String {
        let totalDuration = await data
            .flatMap { $0.activitySegments }
            .reduce(0.0) { partial, segment in
                partial + segment.totalActivityDuration
            }

        // Average daily over the filter window (fixed 7 days, including zero-usage days).
        let avgMinutes = Int((totalDuration / 60.0 / Double(ScreenTimeWindow.dayCount)).rounded())
        // Best-effort only: on physical devices the DeviceActivityReport sandbox
        // silently drops App Group / shared UserDefaults writes (Apple privacy).
        // Simulator often allows the write — host UI still shows this string.
        ScreenTimeSharedStore.writeTodayTotalMinutes(avgMinutes)

        let hours = avgMinutes / 60
        let minutes = avgMinutes % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}
