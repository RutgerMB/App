import DeviceActivity
import Foundation
import SwiftUI

struct TotalActivityConfiguration {
    let totalMinutes: Int
}

/// Device Activity Report scene: sums today's segments and writes minutes to the App Group.
struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .totalActivity
    let content: (TotalActivityConfiguration) -> TotalActivityView

    func makeConfiguration(
        representing data: DeviceActivityResults<DeviceActivityData>
    ) async -> TotalActivityConfiguration {
        var totalSeconds: TimeInterval = 0

        for await deviceData in data {
            for await segment in deviceData.activitySegments {
                totalSeconds += segment.totalActivityDuration
            }
        }

        let totalMinutes = Int((totalSeconds / 60.0).rounded())
        ScreenTimeSharedStore.writeTodayTotalMinutes(totalMinutes)
        return TotalActivityConfiguration(totalMinutes: totalMinutes)
    }
}
