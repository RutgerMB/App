import Foundation

/// RevenueCat configuration aligned with RepLock JS (`src/types/index.ts`).
public enum RepLockRevenueCatConstants {
    /// RevenueCat entitlement identifier — dashboard display name: "RepLocks Pro".
    /// Must match `REVENUECAT_ENTITLEMENT` in `src/types/index.ts`.
    public static let entitlementIdentifier = "pro"

    /// App Store product identifiers.
    public static let productMonthly = "replock_pro_monthly"
    public static let productYearly = "replock_pro_yearly"

    /// RevenueCat offering identifier (dashboard default offering).
    public static let defaultOfferingIdentifier = "default"

    /// RevenueCat public iOS API key (test/sandbox). Override via Info.plist `REVENUECAT_API_KEY`.
    public static let defaultAPIKey = "test_cSXFKgGWQiSeYSJqQpUrEKbhwCi"

    public static var apiKey: String {
        if let plistKey = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String,
           !plistKey.isEmpty {
            return plistKey
        }
        return defaultAPIKey
    }
}
