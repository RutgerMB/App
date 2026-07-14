import UIKit
import Capacitor
import RevenueCat

private func repLockReject(_ call: CAPPluginCall, _ message: String) {
    call.reject(message)
}

private func repLockPresenter(for plugin: CAPPlugin) -> UIViewController? {
    if let bridgeObject = plugin.bridge as? NSObject,
       let vc = bridgeObject.value(forKey: "viewController") as? UIViewController {
        return vc
    }
    return PaywallPresenter.topViewController()
}

@objc(RepLockRevenueCatPlugin)
public class RepLockRevenueCatPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RepLockRevenueCatPlugin"
    public let jsName = "RepLockRevenueCat"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hasProEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCustomerInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentPaywall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentCustomerCenter", returnType: CAPPluginReturnPromise),
    ]

    public override func load() {
        Task { @MainActor in
            RevenueCatManager.shared.configure()
        }
    }

    @objc func configure(_ call: CAPPluginCall) {
        let appUserID = call.getString("appUserID")
        Task { @MainActor in
            RevenueCatManager.shared.configure(appUserID: appUserID)
            call.resolve(["configured": true])
        }
    }

    @objc func logIn(_ call: CAPPluginCall) {
        guard let appUserID = call.getString("appUserID"), !appUserID.isEmpty else {
            repLockReject(call, "appUserID is required")
            return
        }

        Task { @MainActor in
            do {
                let info = try await RevenueCatManager.shared.logIn(appUserID: appUserID)
                call.resolve(RevenueCatManager.serializeCustomerInfo(info))
            } catch {
                repLockReject(call, error.localizedDescription)
            }
        }
    }

    @objc func hasProEntitlement(_ call: CAPPluginCall) {
        Task { @MainActor in
            call.resolve([
                "isPro": RevenueCatManager.shared.hasProEntitlement(),
                "entitlementId": RepLockRevenueCatConstants.entitlementIdentifier,
            ])
        }
    }

    @objc func getCustomerInfo(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                let info = try await RevenueCatManager.shared.refreshCustomerInfo()
                call.resolve(RevenueCatManager.serializeCustomerInfo(info))
            } catch {
                repLockReject(call, error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        let period = call.getString("period") ?? "monthly"
        Task { @MainActor in
            do {
                let info = try await RevenueCatManager.shared.purchase(period: period)
                call.resolve(RevenueCatManager.serializeCustomerInfo(info))
            } catch let error as RevenueCatManagerError {
                if error.isPurchaseCancelled {
                    call.resolve(["cancelled": true, "isPro": RevenueCatManager.shared.hasProEntitlement()])
                    return
                }
                repLockReject(call, error.localizedDescription ?? "Purchase failed")
            } catch {
                repLockReject(call, error.localizedDescription)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                let info = try await RevenueCatManager.shared.restorePurchases()
                var payload = RevenueCatManager.serializeCustomerInfo(info)
                payload["restored"] = RevenueCatManager.shared.hasProEntitlement()
                call.resolve(payload)
            } catch {
                repLockReject(call, error.localizedDescription)
            }
        }
    }

    @objc func presentPaywall(_ call: CAPPluginCall) {
        Task { @MainActor in
            PaywallPresenter.presentPaywall(from: repLockPresenter(for: self))
            call.resolve(["presented": true])
        }
    }

    @objc func presentCustomerCenter(_ call: CAPPluginCall) {
        Task { @MainActor in
            PaywallPresenter.presentCustomerCenter(from: repLockPresenter(for: self))
            call.resolve(["presented": true])
        }
    }
}
