import Foundation
import FamilyControls

@available(iOS 16.0, *)
enum AuthorizationManager {
    static func isAuthorized() -> Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    static func requestAuthorization() async throws {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
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
