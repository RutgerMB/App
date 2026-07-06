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

        store.shield.applications = blockedTokens.isEmpty ? nil : blockedTokens
    }

    static func clearShields() {
        let store = ManagedSettingsStore()
        store.clearAllSettings()
    }
}
