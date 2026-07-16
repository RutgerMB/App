//
//  RepLockDeviceActivityReport.swift
//  RepLockDeviceActivityReport
//
//  Created by Rutger Bleeker on 16/07/2026.
//

import DeviceActivity
import SwiftUI

@main
struct RepLockDeviceActivityReport: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        // Context string must match ScreenTimeSharedKeys.reportContextRawValue
        // ("RepLock.TotalActivity") used by RepLockControls ScreenTimeReportHost.
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }
        // Add more reports here...
    }
}
