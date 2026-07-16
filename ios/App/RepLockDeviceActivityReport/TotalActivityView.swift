//
//  TotalActivityView.swift
//  RepLockDeviceActivityReport
//

import SwiftUI

struct TotalActivityView: View {
    let totalActivity: String

    var body: some View {
        // Rendered inside the DeviceActivityReport extension only.
        // Keep this compact and on-brand — it sits inside the host sheet,
        // not as a full-screen flash over the WebView.
        VStack(spacing: 6) {
            Text(totalActivity)
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 0.55, green: 0.58, blue: 1.0),
                            Color(red: 0.72, green: 0.55, blue: 1.0),
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            Text("avg / day")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1.4)
                .foregroundStyle(Color.secondary)
            Text("last \(ScreenTimeWindow.dayCount) days")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color.secondary.opacity(0.85))
        }
        .frame(maxWidth: .infinity, minHeight: 96)
        .accessibilityLabel("Average daily screen time \(totalActivity) over last \(ScreenTimeWindow.dayCount) days")
    }
}

#Preview {
    TotalActivityView(totalActivity: "4h 12m")
        .padding()
        .background(Color.black)
}
