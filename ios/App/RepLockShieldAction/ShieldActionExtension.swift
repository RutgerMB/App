//
//  ShieldActionExtension.swift
//  RepLockShieldAction
//
//  Handles shield button taps. Apple does NOT support opening the containing
//  app via openURL from ShieldAction — we write an App Group handoff flag and
//  close the shield so the user can switch to RepLock and earn minutes.
//
//  Bundle ID: app.replock.bleeker.RepLockShieldAction
//

import Foundation
import ManagedSettings
import ManagedSettingsUI

enum ShieldHandoffKeys {
    static let appGroupId = "group.com.replock.fitness"
    /// Main app reads this on foreground and routes to Exercise.
    static let pendingEarnMinutes = "replock.shield.pendingEarnMinutes"
    static let pendingAt = "replock.shield.pendingEarnAt"
}

final class ShieldActionExtension: ShieldActionDelegate {
    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handle(action: action, completionHandler: completionHandler)
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handle(action: action, completionHandler: completionHandler)
    }

    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handle(action: action, completionHandler: completionHandler)
    }

    private func handle(
        action: ShieldAction,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            // "Earn minutes" — cannot launch RepLock from this extension (Apple).
            // Flag the App Group; user opens RepLock manually (or via notification later).
            let defaults = UserDefaults(suiteName: ShieldHandoffKeys.appGroupId)
            defaults?.set(true, forKey: ShieldHandoffKeys.pendingEarnMinutes)
            defaults?.set(Date().timeIntervalSince1970, forKey: ShieldHandoffKeys.pendingAt)
            defaults?.synchronize()
            completionHandler(.close)
        case .secondaryButtonPressed:
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
