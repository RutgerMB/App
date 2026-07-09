import Foundation
import FamilyControls
import ManagedSettings

enum RepLockControlsConstants {
    static let appGroupId = "group.com.replock.fitness"
    static let selectionKey = "replock.familyActivitySelection"
    static let unlockMapKey = "replock.unlockMap"
}

@available(iOS 16.0, *)
final class SelectionStore {
    static let shared = SelectionStore()

    private let defaults: UserDefaults?

    private init() {
        defaults = UserDefaults(suiteName: RepLockControlsConstants.appGroupId)
    }

    func loadSelection() -> FamilyActivitySelection {
        guard
            let data = defaults?.data(forKey: RepLockControlsConstants.selectionKey),
            let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
        else {
            return FamilyActivitySelection()
        }
        return selection
    }

    func saveSelection(_ selection: FamilyActivitySelection) {
        guard let data = try? JSONEncoder().encode(selection) else { return }
        defaults?.set(data, forKey: RepLockControlsConstants.selectionKey)
    }

    func stableTokenId(for token: ApplicationToken) -> String? {
        guard let data = try? JSONEncoder().encode(token) else { return nil }
        return data.base64EncodedString()
    }

    func tokenIdMap(from selection: FamilyActivitySelection) -> [String: ApplicationToken] {
        var map: [String: ApplicationToken] = [:]
        for token in selection.applicationTokens {
            if let id = stableTokenId(for: token) {
                map[id] = token
            }
        }
        return map
    }

    func selectedAppsPayload(from selection: FamilyActivitySelection) -> [[String: String]] {
        selection.applicationTokens.enumerated().map { index, token in
            let id = stableTokenId(for: token) ?? "ios-\(index)"
            return [
                "id": id,
                "name": "App \(index + 1)",
            ]
        }
    }
}
