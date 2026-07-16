//
//  TotalActivityView.swift
//  RepLockDeviceActivityReport
//

import SwiftUI

struct TotalActivityView: View {
    let totalActivity: String

    var body: some View {
        // Rendered inside the report extension only — must look like a real total
        // when the host presents DeviceActivityReport on screen.
        Text(totalActivity)
            .font(.system(size: 44, weight: .bold, design: .rounded))
            .monospacedDigit()
            .frame(maxWidth: .infinity, minHeight: 72)
            .accessibilityLabel("Today's screen time \(totalActivity)")
    }
}

#Preview {
    TotalActivityView(totalActivity: "1h 23m")
}
