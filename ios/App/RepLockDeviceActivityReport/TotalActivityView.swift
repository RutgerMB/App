import SwiftUI

/// Minimal report UI. Host app reads totals from the App Group; this view is mostly a probe target.
struct TotalActivityView: View {
    let totalMinutes: Int

    var body: some View {
        Color.clear
            .accessibilityHidden(true)
            .accessibilityLabel("Screen time \(totalMinutes) minutes")
    }
}
