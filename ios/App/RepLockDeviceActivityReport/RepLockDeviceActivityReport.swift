import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
    /// Must match `ScreenTimeSharedKeys.reportContextRawValue` and the host probe.
    static let totalActivity = Self(ScreenTimeSharedKeys.reportContextRawValue)
}

@main
struct RepLockDeviceActivityReportExtension: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        TotalActivityReport { configuration in
            TotalActivityView(totalMinutes: configuration.totalMinutes)
        }
    }
}
