import Foundation
import FamilyControls

@available(iOS 16.0, *)
enum AuthorizationManager {
    /// Callers must invoke from the main actor (FamilyControls requirement).
    static func isAuthorized() -> Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    /// Apple: if `requestAuthorization` returns without throwing, the user granted access.
    /// `authorizationStatus` can briefly lag behind that success — poll briefly, then
    /// treat a non-throwing result as approved even if status has not flipped yet.
    /// Must run on the main actor.
    @MainActor
    static func requestAuthorization() async throws -> (authorized: Bool, status: String) {
        if isAuthorized() {
            return (true, statusLabel())
        }

        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)

        // Status sometimes stays `.notDetermined` for a short window after Allow.
        for _ in 0..<12 {
            if AuthorizationCenter.shared.authorizationStatus == .approved {
                return (true, "approved")
            }
            if AuthorizationCenter.shared.authorizationStatus == .denied {
                break
            }
            try? await Task.sleep(nanoseconds: 50_000_000) // 50ms
        }

        let label = statusLabel()
        // Non-throwing requestAuthorization means the user allowed — do not report denied.
        if AuthorizationCenter.shared.authorizationStatus == .denied {
            return (false, "denied")
        }
        return (true, label == "denied" ? "approved" : label)
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
