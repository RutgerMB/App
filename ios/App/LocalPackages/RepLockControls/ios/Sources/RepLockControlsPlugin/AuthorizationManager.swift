import Foundation
import FamilyControls
import UIKit

@available(iOS 16.0, *)
enum AuthorizationManager {
    /// True for `.approved` and `.approvedWithDataAccess` (and future approved* cases).
    /// Callers must invoke from the main actor (FamilyControls requirement).
    static func isAuthorized() -> Bool {
        isApprovedStatus(AuthorizationCenter.shared.authorizationStatus)
    }

    /// Request Family Controls authorization.
    ///
    /// Apple: a non-throwing `requestAuthorization` means the user tapped Allow
    /// (Face ID / system sheet). Status can lag briefly — we poll for an approved*
    /// status. Never invent approval, but do treat `.approvedWithDataAccess` as
    /// success (required when the app-and-website-usage entitlement is present).
    @MainActor
    static func requestAuthorization() async throws -> (authorized: Bool, status: String) {
        if isAuthorized() {
            return (true, statusLabel())
        }

        // Family Controls presents system UI — app must be foreground/active.
        guard UIApplication.shared.applicationState == .active else {
            throw AuthorizationRequestError.appNotActive
        }

        // Let the current touch / Capacitor bridge settle on the main run loop.
        await Task.yield()

        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)

        // Status sometimes lags after Allow (or lands on approvedWithDataAccess).
        for _ in 0..<60 {
            let status = AuthorizationCenter.shared.authorizationStatus
            if isApprovedStatus(status) {
                return (true, "approved")
            }
            if status == .denied {
                return (false, "denied")
            }
            try? await Task.sleep(nanoseconds: 50_000_000) // 50ms × 60 = 3s
        }

        // Honest result — never fabricate approved.
        return (isAuthorized(), statusLabel())
    }

    /// Re-read after a failed request — user may have approved in Settings meanwhile.
    static func refreshStatus() -> (authorized: Bool, status: String) {
        (isAuthorized(), statusLabel())
    }

    static func statusLabel() -> String {
        let status = AuthorizationCenter.shared.authorizationStatus
        if isApprovedStatus(status) {
            return "approved"
        }
        switch status {
        case .denied:
            return "denied"
        case .notDetermined:
            return "notDetermined"
        default:
            return "unknown"
        }
    }

    /// `.approved`, `.approvedWithDataAccess`, and any future approved* raw value.
    private static func isApprovedStatus(_ status: AuthorizationStatus) -> Bool {
        switch status {
        case .approved:
            return true
        case .denied, .notDetermined:
            return false
        default:
            // Covers `.approvedWithDataAccess` on SDKs that declare it, and
            // @unknown cases on older Xcode compiling against newer runtimes.
            return String(describing: status).lowercased().contains("approved")
        }
    }
}

@available(iOS 16.0, *)
enum AuthorizationRequestError: LocalizedError {
    case appNotActive

    var errorDescription: String? {
        switch self {
        case .appNotActive:
            return "App must be in the foreground to show the Screen Time permission dialog"
        }
    }
}
