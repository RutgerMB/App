import Foundation
import FamilyControls
import ManagedSettings

enum RepLockControlsConstants {
    static let appGroupId = "group.com.replock.fitness"
    static let selectionKey = "replock.familyActivitySelection"
    static let unlockMapKey = "replock.unlockMap"
    /// User-chosen labels keyed by opaque token id. Apple never exposes real app
    /// names/bundle IDs to the host app — only FamilyControls `Label(token)` can
    /// render system name+icon inside a native UI surface.
    static let displayNamesKey = "replock.tokenDisplayNames"
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
        pruneDisplayNames(to: selection)
    }

    /// Drop opaque ApplicationTokens by stable id (JS lock-list remove / trash).
    /// Returns the tokens that were removed so ManagedSettings can clear them.
    @discardableResult
    func removeApplicationTokens(ids: Set<String>) -> Set<ApplicationToken> {
        guard !ids.isEmpty else { return [] }
        var selection = loadSelection()
        let map = tokenIdMap(from: selection)
        var removed = Set<ApplicationToken>()
        var kept = Set<ApplicationToken>()
        for (id, token) in map {
            if ids.contains(id) {
                removed.insert(token)
            } else {
                kept.insert(token)
            }
        }
        guard !removed.isEmpty else { return [] }
        selection.applicationTokens = kept
        saveSelection(selection)
        return removed
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

    // MARK: - Display names (user-editable; not system app names)

    func loadDisplayNames() -> [String: String] {
        (defaults?.dictionary(forKey: RepLockControlsConstants.displayNamesKey) as? [String: String]) ?? [:]
    }

    func saveDisplayNames(_ names: [String: String]) {
        var cleaned: [String: String] = [:]
        for (id, raw) in names {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                cleaned[id] = trimmed
            }
        }
        defaults?.set(cleaned, forKey: RepLockControlsConstants.displayNamesKey)
        defaults?.synchronize()
    }

    /// Merge nicknames into the existing map (confirmation / rename path).
    func mergeDisplayNames(_ names: [String: String]) {
        var merged = loadDisplayNames()
        for (id, raw) in names {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                merged.removeValue(forKey: id)
            } else {
                merged[id] = trimmed
            }
        }
        saveDisplayNames(merged)
    }

    func setDisplayName(_ name: String, forTokenId tokenId: String) {
        mergeDisplayNames([tokenId: name])
    }

    private func pruneDisplayNames(to selection: FamilyActivitySelection) {
        let valid = Set(tokenIdMap(from: selection).keys)
        var names = loadDisplayNames()
        let before = names.count
        names = names.filter { valid.contains($0.key) }
        if names.count != before {
            saveDisplayNames(names)
        }
    }

    /// Payload for JS. `name` is a user label when set; otherwise a placeholder.
    /// Real system names cannot be read from ApplicationToken (Apple privacy).
    func selectedAppsPayload(from selection: FamilyActivitySelection) -> [[String: Any]] {
        let custom = loadDisplayNames()
        return selection.applicationTokens.enumerated().map { index, token in
            let id = stableTokenId(for: token) ?? "ios-\(index)"
            let placeholder = "App \(index + 1)"
            let customName = custom[id]
            let name = (customName?.isEmpty == false) ? customName! : placeholder
            return [
                "id": id,
                "name": name,
                "hasCustomName": customName != nil && !(customName?.isEmpty ?? true),
                "placeholderName": placeholder,
            ]
        }
    }
}
