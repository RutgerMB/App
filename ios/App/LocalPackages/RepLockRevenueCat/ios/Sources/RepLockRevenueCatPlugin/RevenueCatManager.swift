import Foundation
import RevenueCat

public enum RevenueCatManagerError: LocalizedError {
    case notConfigured
    case noCurrentOffering
    case packageUnavailable(String)
    case purchaseCancelled
    case purchaseSucceededWithoutEntitlement
    case underlying(Error)

    public var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "RevenueCat is not configured. Call configure() at app launch."
        case .noCurrentOffering:
            return "No current offering is available. Check RevenueCat dashboard setup."
        case .packageUnavailable(let period):
            return "\(period.capitalized) plan is not available yet."
        case .purchaseCancelled:
            return nil
        case .purchaseSucceededWithoutEntitlement:
            return "Purchase completed but RepLocks Pro was not activated."
        case .underlying(let error):
            return error.localizedDescription
        }
    }

    public var isPurchaseCancelled: Bool {
        if case .purchaseCancelled = self { return true }
        return false
    }
}

@MainActor
public final class RevenueCatManager: NSObject, ObservableObject {
    public static let shared = RevenueCatManager()

    @Published public private(set) var isConfigured = false
    @Published public private(set) var customerInfo: CustomerInfo?
    @Published public private(set) var isPro = false
    @Published public private(set) var isLoading = false
    @Published public private(set) var lastErrorMessage: String?

    private var customerInfoTask: Task<Void, Never>?

    private override init() {
        super.init()
    }

    /// Configure RevenueCat once at launch. Safe to call multiple times — subsequent calls are ignored.
    public func configure(appUserID: String? = nil) {
        guard !isConfigured else { return }

        let apiKey = RepLockRevenueCatConstants.apiKey
        guard !apiKey.isEmpty else {
            lastErrorMessage =
                "REVENUECAT_API_KEY missing. Set VITE_REVENUECAT_API_KEY_IOS=appl_… and run npm run cap:ios:sync."
            return
        }

        #if DEBUG
        Purchases.logLevel = .debug
        #else
        Purchases.logLevel = .warn
        #endif

        if let appUserID, !appUserID.isEmpty {
            Purchases.configure(withAPIKey: apiKey, appUserID: appUserID)
        } else {
            Purchases.configure(withAPIKey: apiKey)
        }

        Purchases.shared.delegate = self
        isConfigured = true
        startCustomerInfoListener()
    }

    public func logIn(appUserID: String) async throws -> CustomerInfo {
        ensureConfigured()
        let (info, _) = try await Purchases.shared.logIn(appUserID)
        applyCustomerInfo(info)
        return info
    }

    public func logOut() async throws -> CustomerInfo {
        ensureConfigured()
        let info = try await Purchases.shared.logOut()
        applyCustomerInfo(info)
        return info
    }

    public func refreshCustomerInfo() async throws -> CustomerInfo {
        ensureConfigured()
        isLoading = true
        defer { isLoading = false }
        let info = try await Purchases.shared.customerInfo()
        applyCustomerInfo(info)
        return info
    }

    public func hasProEntitlement() -> Bool {
        customerInfo?.entitlements.active[RepLockRevenueCatConstants.entitlementIdentifier] != nil
    }

    public func getCurrentOffering() async throws -> Offering {
        ensureConfigured()
        let offerings = try await Purchases.shared.offerings()

        // Prefer dashboard Current offering when it has packages.
        if let current = offerings.current, !current.availablePackages.isEmpty {
            return current
        }

        // Explicit App Store offering id (`defaults`), then legacy Test Store (`default`).
        let candidates = [
            RepLockRevenueCatConstants.defaultOfferingIdentifier,
            RepLockRevenueCatConstants.legacyOfferingIdentifier,
        ]
        for id in candidates {
            if let named = offerings.offering(identifier: id), !named.availablePackages.isEmpty {
                return named
            }
        }

        // Last resort: first offering that actually has packages.
        if let any = offerings.all.values.first(where: { !$0.availablePackages.isEmpty }) {
            return any
        }

        throw RevenueCatManagerError.noCurrentOffering
    }

    public func package(for period: String) async throws -> Package {
        let offering = try await getCurrentOffering()
        switch period.lowercased() {
        case "yearly", "annual":
            if let annual = offering.annual {
                return annual
            }
            if let match = offering.availablePackages.first(where: {
                $0.packageType == .annual ||
                $0.storeProduct.productIdentifier == RepLockRevenueCatConstants.productYearly
            }) {
                return match
            }
            throw RevenueCatManagerError.packageUnavailable("yearly")
        default:
            if let monthly = offering.monthly {
                return monthly
            }
            if let match = offering.availablePackages.first(where: {
                $0.packageType == .monthly ||
                $0.storeProduct.productIdentifier == RepLockRevenueCatConstants.productMonthly
            }) {
                return match
            }
            throw RevenueCatManagerError.packageUnavailable("monthly")
        }
    }

    public func purchase(period: String) async throws -> CustomerInfo {
        ensureConfigured()
        isLoading = true
        defer { isLoading = false }

        let selected = try await package(for: period)
        do {
            let result = try await Purchases.shared.purchase(package: selected)
            applyCustomerInfo(result.customerInfo)
            if !hasProEntitlement() {
                throw RevenueCatManagerError.purchaseSucceededWithoutEntitlement
            }
            return result.customerInfo
        } catch let error as RevenueCatManagerError {
            throw error
        } catch {
            if Self.isPurchaseCancelled(error) {
                throw RevenueCatManagerError.purchaseCancelled
            }
            throw RevenueCatManagerError.underlying(error)
        }
    }

    public func restorePurchases() async throws -> CustomerInfo {
        ensureConfigured()
        isLoading = true
        defer { isLoading = false }
        let info = try await Purchases.shared.restorePurchases()
        applyCustomerInfo(info)
        return info
    }

    public func customerInfoDictionary() -> [String: Any] {
        guard let info = customerInfo else { return [:] }
        return Self.serializeCustomerInfo(info)
    }

    public static func serializeCustomerInfo(_ info: CustomerInfo) -> [String: Any] {
        let activeEntitlements = info.entitlements.active.keys.sorted()
        let pro = info.entitlements.active[RepLockRevenueCatConstants.entitlementIdentifier]
        return [
            "originalAppUserId": info.originalAppUserId,
            "isPro": pro != nil,
            "entitlementId": RepLockRevenueCatConstants.entitlementIdentifier,
            "activeEntitlements": activeEntitlements,
            "expirationDate": pro?.expirationDate?.timeIntervalSince1970 ?? NSNull(),
            "willRenew": pro?.willRenew ?? false,
            "productIdentifier": pro?.productIdentifier ?? NSNull(),
        ]
    }

    private func ensureConfigured() {
        if !isConfigured {
            configure()
        }
    }

    private func startCustomerInfoListener() {
        customerInfoTask?.cancel()
        customerInfoTask = Task { [weak self] in
            guard let self else { return }
            do {
                let info = try await Purchases.shared.customerInfo()
                await self.applyCustomerInfo(info)
            } catch {
                await MainActor.run {
                    self.lastErrorMessage = error.localizedDescription
                }
            }
        }
    }

    private func applyCustomerInfo(_ info: CustomerInfo) {
        customerInfo = info
        isPro = info.entitlements.active[RepLockRevenueCatConstants.entitlementIdentifier] != nil
        lastErrorMessage = nil
    }

    private static func isPurchaseCancelled(_ error: Error) -> Bool {
        let nsError = error as NSError
        return nsError.domain == ErrorCode.errorDomain &&
            nsError.code == ErrorCode.purchaseCancelledError.rawValue
    }
}

extension RevenueCatManager: PurchasesDelegate {
    nonisolated public func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            self.applyCustomerInfo(customerInfo)
        }
    }
}
