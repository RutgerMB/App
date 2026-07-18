import Foundation
import ManagedSettings
import FamilyControls

struct IosBlockRule {
    let tokenId: String
    let blocked: Bool
    let unlockedUntil: Double
}

@available(iOS 16.0, *)
enum ShieldManager {
    static func applyRules(_ rules: [IosBlockRule], selection: FamilyActivitySelection) {
        let store = ManagedSettingsStore()
        let tokenMap = SelectionStore.shared.tokenIdMap(from: selection)
        let now = Date().timeIntervalSince1970 * 1000

        var blockedTokens = Set<ApplicationToken>()
        for rule in rules {
            guard rule.blocked, let token = tokenMap[rule.tokenId] else { continue }
            if rule.unlockedUntil > now { continue }
            blockedTokens.insert(token)
        }

        if blockedTokens.isEmpty {
            store.shield.applications = nil as Set<ApplicationToken>?
        } else {
            store.shield.applications = blockedTokens
        }
    }

    /// Immediately lift shields for specific tokens (trash / remove) without
    /// waiting for a full rules rebuild from JS.
    static func unshield(tokens: Set<ApplicationToken>) {
        guard !tokens.isEmpty else { return }
        let store = ManagedSettingsStore()
        guard var current = store.shield.applications, !current.isEmpty else { return }
        current.subtract(tokens)
        if current.isEmpty {
            store.shield.applications = nil as Set<ApplicationToken>?
        } else {
            store.shield.applications = current
        }
    }

    static func clearShields() {
        let store = ManagedSettingsStore()
        store.clearAllSettings()
    }
}
