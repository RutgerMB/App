//
//  TotalActivityReport.swift
//  RepLockDeviceActivityReport
//
//  DeviceActivityReport scene that sums today's activity and writes minutes
//  into the App Group for the main app (RepLockControls probe) to read.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
    /// Must match `ScreenTimeSharedKeys.reportContextRawValue` in the host app.
    static let repLockTotalActivity = Self(ScreenTimeSharedKeys.reportContextRawValue)
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

        let totalMinutes = Int((totalDuration / 60.0).rounded())
        ScreenTimeSharedStore.writeTodayTotalMinutes(totalMinutes)

        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}
