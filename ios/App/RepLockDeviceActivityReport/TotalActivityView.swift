//
//  TotalActivityView.swift
//  RepLockDeviceActivityReport
//

import SwiftUI

struct TotalActivityView: View {
    let totalActivity: String

    var body: some View {
        Text(totalActivity)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .accessibilityHidden(true)
    }
}

#Preview {
    TotalActivityView(totalActivity: "1h 23m")
}
