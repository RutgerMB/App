import Foundation
import os

/// RevenueCat configuration aligned with RepLock JS (`src/types/index.ts`).
public enum RepLockRevenueCatConstants {
    /// RevenueCat entitlement identifier — dashboard display name: "RepLocks Pro".
    /// Must match `REVENUECAT_ENTITLEMENT` in `src/types/index.ts`.
    public static let entitlementIdentifier = "pro"

    /// App Store product identifiers.
    public static let productMonthly = "replock_pro_monthly"
    public static let productYearly = "replock_pro_yearly"

    /// RevenueCat offering identifier — App Store Current offering is `defaults`
    /// (also ofrnga896d35397). Prefer `offerings.current`, then this id via silent `all[]`.
    public static let defaultOfferingIdentifier = "defaults"

    /// Legacy Test Store offering id. Do **not** pass to `offering(identifier:)` — that API
    /// logs a WARN when the id is absent. Only use silent `offerings.all[…]` as last resort.
    public static let legacyOfferingIdentifier = "default"

    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "app.replock.bleeker",
        category: "RepLockRevenueCat"
    )

    /// Public iOS SDK key from Info.plist `REVENUECAT_API_KEY` (injected by `npm run cap:ios:sync`).
    /// Must be the App Store key (`appl_…`) for device / sandbox StoreKit — never the Test Store (`test_…`).
    public static var apiKey: String {
        let plistKey = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String
        let key = plistKey?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        if key.isEmpty {
            logger.error(
                "REVENUECAT_API_KEY missing from Info.plist. Run `npm run cap:ios:sync` after setting VITE_REVENUECAT_API_KEY_IOS=appl_… in .env"
            )
            assertionFailure("REVENUECAT_API_KEY missing from Info.plist")
            return ""
        }

        if key.hasPrefix("test_") {
            #if targetEnvironment(simulator)
            logger.warning(
                "Using RevenueCat Test Store key (test_…). OK for RC Test Store simulator flow only — not real StoreKit."
            )
            #else
            logger.error(
                "CRITICAL: RevenueCat Test Store key (test_…) on a device build. Sandbox IAP will fail / offerings empty. Use App Store public SDK key (appl_…) from RevenueCat → Project → API keys for app.replock.bleeker. Set VITE_REVENUECAT_API_KEY_IOS and re-run npm run cap:ios:sync."
            )
            print(
                "❌ [RepLock] RevenueCat Test Store key detected on device. Use appl_… App Store SDK key — see IOS_SETUP.md"
            )
            #endif
        }

        return key
    }
}
