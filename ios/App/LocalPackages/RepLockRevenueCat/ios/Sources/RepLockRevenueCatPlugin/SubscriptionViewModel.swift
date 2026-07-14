import Foundation
import RevenueCat

@MainActor
public final class SubscriptionViewModel: ObservableObject {
    @Published public private(set) var isPro = false
    @Published public private(set) var isLoading = false
    @Published public private(set) var monthlyPackage: Package?
    @Published public private(set) var yearlyPackage: Package?
    @Published public private(set) var errorMessage: String?
    @Published public private(set) var customerInfo: CustomerInfo?

    private let manager: RevenueCatManager

    public init(manager: RevenueCatManager = .shared) {
        self.manager = manager
        bindManager()
    }

    public func loadOfferings() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let offering = try await manager.getCurrentOffering()
            monthlyPackage = offering.monthly ?? offering.availablePackages.first {
                $0.packageType == .monthly ||
                $0.storeProduct.productIdentifier == RepLockRevenueCatConstants.productMonthly
            }
            yearlyPackage = offering.annual ?? offering.availablePackages.first {
                $0.packageType == .annual ||
                $0.storeProduct.productIdentifier == RepLockRevenueCatConstants.productYearly
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    public func refreshEntitlement() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let info = try await manager.refreshCustomerInfo()
            customerInfo = info
            isPro = manager.hasProEntitlement()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    public func purchaseMonthly() async {
        await purchase(period: "monthly")
    }

    public func purchaseYearly() async {
        await purchase(period: "yearly")
    }

    public func restore() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let info = try await manager.restorePurchases()
            customerInfo = info
            isPro = manager.hasProEntitlement()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func purchase(period: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let info = try await manager.purchase(period: period)
            customerInfo = info
            isPro = manager.hasProEntitlement()
        } catch let error as RevenueCatManagerError {
            if !error.isPurchaseCancelled {
                errorMessage = error.localizedDescription
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func bindManager() {
        isPro = manager.isPro
        customerInfo = manager.customerInfo
        isLoading = manager.isLoading
        errorMessage = manager.lastErrorMessage
    }
}
