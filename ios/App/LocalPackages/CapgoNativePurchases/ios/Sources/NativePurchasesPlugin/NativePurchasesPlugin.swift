import Foundation
import UIKit
import Capacitor
import StoreKit

@objc(NativePurchasesPlugin)
public class NativePurchasesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativePurchasesPlugin"
    public let jsName = "NativePurchases"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isBillingSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentOfferCodeRedeemSheet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledgePurchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumePurchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAppTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isEntitledToOldBusinessModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStorefront", returnType: CAPPluginReturnPromise)
    ]

    private let pluginVersion: String = "8.6.3"
    private var transactionUpdatesTask: Task<Void, Never>?

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }

    override public func load() {
        super.load()
        startTransactionUpdatesListener()
    }

    deinit {
        transactionUpdatesTask?.cancel()
        transactionUpdatesTask = nil
    }

    private func startTransactionUpdatesListener() {
        transactionUpdatesTask?.cancel()
        transactionUpdatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard !Task.isCancelled else { break }
                switch result {
                case .verified(let transaction):
                    let payload = await TransactionHelpers.buildTransactionResponse(
                        from: transaction,
                        jwsRepresentation: result.jwsRepresentation,
                        alwaysIncludeWillCancel: true
                    )
                    await transaction.finish()
                    try? await Task.sleep(nanoseconds: 500_000_000)
                    await MainActor.run {
                        self?.notifyListeners("transactionUpdated", data: payload)
                    }
                case .unverified(let transaction, let error):
                    await MainActor.run {
                        self?.notifyListeners("transactionVerificationFailed", data: [
                            "transactionId": String(transaction.id),
                            "error": error.localizedDescription
                        ])
                    }
                }
            }
        }
    }

    @objc func isBillingSupported(_ call: CAPPluginCall) {
        call.resolve(["isBillingSupported": true])
    }

    @objc func getStorefront(_ call: CAPPluginCall) {
        print("getStorefront")
        Task {
            let storefront = await Storefront.current
            await MainActor.run {
                if let storefront = storefront {
                    call.resolve([
                        "countryCode": storefront.countryCode,
                        "storefrontId": storefront.id
                    ])
                } else {
                    // No storefront (e.g. alternative distribution).
                    print("getStorefront: no storefront available")
                    call.resolve(["countryCode": ""])
                }
            }
        }
    }

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        print("purchaseProduct")
        let productIdentifier = call.getString("productIdentifier", "")
        let quantity = call.getInt("quantity", 1)
        let appAccountTokenRaw = call.getString("appAccountToken", "")
        let appAccountToken = appAccountTokenRaw.isEmpty ? nil : appAccountTokenRaw
        let billingPlanTypeRaw = call.getString("billingPlanType", "")
        let billingPlanType = billingPlanTypeRaw.isEmpty ? nil : billingPlanTypeRaw
        let autoAcknowledge = call.getBool("autoAcknowledgePurchases", true)

        if productIdentifier.isEmpty {
            capgoReject(call,"productIdentifier is Empty, give an id")
            return
        }

        print("Auto-acknowledge enabled: \(autoAcknowledge)")

        Task { @MainActor [self] in
            do {
                let products = try await Product.products(for: [productIdentifier])
                guard let product = products.first else {
                    capgoReject(call,"Cannot find product for id \(productIdentifier)")
                    return
                }

                var purchaseOptions = Set<Product.PurchaseOption>()
                purchaseOptions.insert(.quantity(quantity))
                if let token = appAccountToken, !token.isEmpty, let uuid = UUID(uuidString: token) {
                    purchaseOptions.insert(.appAccountToken(uuid))
                }
                switch billingPlanPurchaseOption(from: billingPlanType) {
                case .none:
                    break
                case .option(let option):
                    purchaseOptions.insert(option)
                case .failure(let message):
                    capgoReject(call,message)
                    return
                }

                let result = try await product.purchase(options: purchaseOptions)
                print("purchaseProduct result \(result)")
                await handlePurchaseResult(result, call: call, autoFinish: autoAcknowledge)
            } catch {
                print(error)
                capgoReject(call,error.localizedDescription)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        print("restorePurchases")
        Task {
            do {
                try await AppStore.sync()
                for transaction in SKPaymentQueue.default().transactions {
                    SKPaymentQueue.default().finishTransaction(transaction)
                }
                await MainActor.run { call.resolve() }
            } catch {
                await MainActor.run { capgoReject(call,error.localizedDescription) }
            }
        }
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let productIdentifiers = call.getArray("productIdentifiers", []).compactMap { $0 as? String }
        let productType = call.getString("productType", "inapp")
        print("productIdentifiers \(productIdentifiers)")
        print("productType \(productType)")
        Task {
            do {
                let products = try await Product.products(for: productIdentifiers)
                print("products \(products)")
                let productsJson: [[String: Any]] = products.map { $0.dictionary }
                await MainActor.run { call.resolve(["products": productsJson]) }
            } catch {
                print("error \(error)")
                await MainActor.run { capgoReject(call,error.localizedDescription) }
            }
        }
    }

    @objc func getProduct(_ call: CAPPluginCall) {
        let productIdentifier = call.getString("productIdentifier", "")
        let productType = call.getString("productType", "inapp")
        print("productIdentifier \(productIdentifier)")
        print("productType \(productType)")
        if productIdentifier.isEmpty {
            capgoReject(call,"productIdentifier is empty")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productIdentifier])
                print("products \(products)")
                if let product = products.first {
                    await MainActor.run { call.resolve(["product": product.dictionary]) }
                } else {
                    await MainActor.run { capgoReject(call,"Product not found") }
                }
            } catch {
                print(error)
                await MainActor.run { capgoReject(call,error.localizedDescription) }
            }
        }
    }

    @objc func getPurchases(_ call: CAPPluginCall) {
        print("getPurchases")
        let appAccountTokenRaw = call.getString("appAccountToken", "")
        let appAccountTokenFilter = appAccountTokenRaw.isEmpty ? nil : appAccountTokenRaw
        let onlyCurrentEntitlements = call.getBool("onlyCurrentEntitlements", false)
        Task {
            do {
                let allPurchases = try await TransactionHelpers.collectAllPurchases(
                    appAccountTokenFilter: appAccountTokenFilter,
                    onlyCurrentEntitlements: onlyCurrentEntitlements
                )
                await MainActor.run { call.resolve(["purchases": allPurchases]) }
            } catch {
                await MainActor.run { capgoReject(call,error.localizedDescription) }
            }
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        print("manageSubscriptions")
        Task { @MainActor in
            do {
                guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
                    capgoReject(call,"Unable to get window scene")
                    return
                }
                try await AppStore.showManageSubscriptions(in: windowScene)
                call.resolve()
            } catch {
                print("manageSubscriptions error: \(error)")
                capgoReject(call,error.localizedDescription)
            }
        }
    }

    @objc func presentOfferCodeRedeemSheet(_ call: CAPPluginCall) {
        print("presentOfferCodeRedeemSheet")
        if #available(iOS 16.0, *) {
            Task { @MainActor [self] in
                await handlePresentOfferCodeRedeemSheet(call)
            }
        } else {
            capgoReject(call,"Offer code redemption requires iOS 16.0 or later")
        }
    }

    @objc func acknowledgePurchase(_ call: CAPPluginCall) {
        print("acknowledgePurchase called on iOS")

        let purchaseToken = call.getString("purchaseToken", "")
        guard !purchaseToken.isEmpty else {
            capgoReject(call,"purchaseToken is required")
            return
        }

        guard let transactionId = UInt64(purchaseToken) else {
            capgoReject(call,"Invalid purchaseToken format")
            return
        }

        Task {
            var foundTransaction: Transaction?
            for await verificationResult in Transaction.all {
                if case .verified(let transaction) = verificationResult, transaction.id == transactionId {
                    foundTransaction = transaction
                    break
                }
            }

            guard let transaction = foundTransaction else {
                await MainActor.run {
                    capgoReject(call,"Transaction not found or already finished. Transaction ID: \(transactionId)")
                }
                return
            }

            print("Manually finishing transaction: \(transaction.id)")
            await transaction.finish()
            await MainActor.run {
                print("Transaction finished successfully")
                call.resolve()
            }
        }
    }

    @objc func consumePurchase(_ call: CAPPluginCall) {
        capgoReject(call,"consumePurchase is only available on Android")
    }

}

private enum BillingPlanPurchaseOptionResult {
    case none
    case option(Product.PurchaseOption)
    case failure(String)
}

private extension NativePurchasesPlugin {
    func billingPlanPurchaseOption(from billingPlanType: String?) -> BillingPlanPurchaseOptionResult {
        guard let billingPlanType = billingPlanType, !billingPlanType.isEmpty else {
            return .none
        }
        guard let normalizedBillingPlanType = StoreKitPayloadHelpers.purchaseBillingPlanType(from: billingPlanType) else {
            return .failure("billingPlanType must be monthly or upFront")
        }
        guard #available(iOS 26.4, *) else {
            return .failure("billingPlanType requires iOS 26.4 or later")
        }

        #if STOREKIT_26_5
        if let option = Product.PurchaseOption.capacitorBillingPlanType(normalizedBillingPlanType) {
            return .option(option)
        }
        return .failure("billingPlanType must be monthly or upFront")
        #else
        return .failure("billingPlanType requires building with Xcode 26.5 SDK or later")
        #endif
    }
}

// MARK: - iOS 16+ App Transaction Methods
extension NativePurchasesPlugin {
    @available(iOS 16.0, *)
    @MainActor
    private func handlePresentOfferCodeRedeemSheet(_ call: CAPPluginCall) async {
        do {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
                capgoReject(call,"Unable to get window scene")
                return
            }
            try await AppStore.presentOfferCodeRedeemSheet(in: windowScene)
            call.resolve()
        } catch {
            print("presentOfferCodeRedeemSheet error: \(error)")
            capgoReject(call,error.localizedDescription)
        }
    }


    @objc func getAppTransaction(_ call: CAPPluginCall) {
        if #available(iOS 16.0, *) {
            Task { @MainActor [self] in
                await handleGetAppTransaction(call)
            }
        } else {
            capgoReject(call,"App Transaction requires iOS 16.0 or later")
        }
    }

    @objc func isEntitledToOldBusinessModel(_ call: CAPPluginCall) {
        let targetBuildNumber = call.getString("targetBuildNumber", "")
        guard !targetBuildNumber.isEmpty else {
            capgoReject(call,"targetBuildNumber is required on iOS")
            return
        }

        if #available(iOS 16.0, *) {
            Task { @MainActor [self] in
                await handleIsEntitledToOldBusinessModel(call, targetBuildNumber: targetBuildNumber)
            }
        } else {
            capgoReject(call,"App Transaction requires iOS 16.0 or later")
        }
    }

    @available(iOS 16.0, *)
    @MainActor
    private func handleGetAppTransaction(_ call: CAPPluginCall) async {
        print("getAppTransaction called on iOS")
        do {
            let verificationResult = try await AppTransaction.shared
            switch verificationResult {
            case .verified(let appTransaction):
                let response: [String: Any] = [
                    "originalAppVersion": appTransaction.originalAppVersion,
                    "originalPurchaseDate": ISO8601DateFormatter().string(
                        from: appTransaction.originalPurchaseDate
                    ),
                    "bundleId": appTransaction.bundleID,
                    "appVersion": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "",
                    "jwsRepresentation": verificationResult.jwsRepresentation,
                    "environment": appTransaction.environment.environmentString
                ]
                call.resolve(["appTransaction": response])
            case .unverified(_, let error):
                capgoReject(call,"App transaction verification failed: \(error.localizedDescription)")
            }
        } catch {
            print("getAppTransaction error: \(error)")
            capgoReject(call,"Failed to get app transaction: \(error.localizedDescription)")
        }
    }

    @available(iOS 16.0, *)
    @MainActor
    private func handleIsEntitledToOldBusinessModel(
        _ call: CAPPluginCall,
        targetBuildNumber: String
    ) async {
        print("isEntitledToOldBusinessModel called with targetBuildNumber: \(targetBuildNumber)")
        do {
            let verificationResult = try await AppTransaction.shared
            switch verificationResult {
            case .verified(let appTransaction):
                let originalBuildNumber = appTransaction.originalAppVersion
                let originalInt = Int(originalBuildNumber) ?? 0
                let targetInt = Int(targetBuildNumber) ?? 0
                call.resolve([
                    "isOlderVersion": originalInt < targetInt,
                    "originalAppVersion": originalBuildNumber
                ])
            case .unverified(_, let error):
                capgoReject(call,"App transaction verification failed: \(error.localizedDescription)")
            }
        } catch {
            print("isEntitledToOldBusinessModel error: \(error)")
            capgoReject(call,"Failed to get app transaction: \(error.localizedDescription)")
        }
    }
}

@available(iOS 16.0, *)
private extension AppStore.Environment {
    var environmentString: String {
        switch self {
        case .sandbox: return "Sandbox"
        case .production: return "Production"
        case .xcode: return "Xcode"
        default: return "Production"
        }
    }
}
