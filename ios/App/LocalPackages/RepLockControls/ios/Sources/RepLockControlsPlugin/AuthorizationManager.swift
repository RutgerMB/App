import Foundation
import FamilyControls

@available(iOS 16.0, *)
enum AuthorizationManager {
    /// Callers must invoke from the main actor (FamilyControls requirement).
    static func isAuthorized() -> Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    /// Request Family Controls authorization.
    ///
    /// Apple: a non-throwing `requestAuthorization` means the user tapped Allow.
    /// `authorizationStatus` can lag briefly, so we poll — but we only report
    /// `authorized: true` when status is actually `.approved`. Claiming success
    /// while status is still `.notDetermined` / `.denied` causes the activity
    /// picker to fail with "Screen Time authorization required".
    @MainActor
    static func requestAuthorization() async throws -> (authorized: Bool, status: String) {
        if isAuthorized() {
            return (true, statusLabel())
        }

        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)

        // Status sometimes stays `.notDetermined` for a short window after Allow.
        for _ in 0..<40 {
            let status = AuthorizationCenter.shared.authorizationStatus
            if status == .approved {
                return (true, "approved")
            }
            if status == .denied {
                return (false, "denied")
            }
            try? await Task.sleep(nanoseconds: 50_000_000) // 50ms × 40 = 2s
        }

        // Honest result — never fabricate approved.
        return (isAuthorized(), statusLabel())
    }

    /// Re-read after a failed request — user may have approved in Settings meanwhile.
    static func refreshStatus() -> (authorized: Bool, status: String) {
        (isAuthorized(), statusLabel())
    }

    static func statusLabel() -> String {
        switch AuthorizationCenter.shared.authorizationStatus {
        case .approved:
            return "approved"
        case .denied:
            return "denied"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "unknown"
        }
    }
}
