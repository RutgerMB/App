import UIKit
import Capacitor
import RevenueCat
import RepLockPluginBridge

// Capacitor 8 SPM hides `reject` and CAPPluginCallError Swift inits on Xcode 15.x.
private func repLockReject(_ call: CAPPluginCall, _ message: String, code: String? = nil) {
    RepLockRejectPluginCall(call, message, code)
}

@MainActor
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

    /// Weak ref so SwiftUI paywall can notify the WebView after purchase/restore.
    @MainActor
    public static weak var sharedInstance: RepLockRevenueCatPlugin?

    public override func load() {
        Task { @MainActor in
            Self.sharedInstance = self
            RevenueCatManager.shared.configure()
        }
    }

    @MainActor
    public static func notifyCustomerInfoUpdated(_ info: CustomerInfo) {
        guard let plugin = sharedInstance else { return }
        plugin.notifyListeners("customerInfoUpdated", data: RevenueCatManager.serializeCustomerInfo(info))
    }

    @objc func configure(_ call: CAPPluginCall) {
        let appUserIDRaw = call.getString("appUserID", "")
        let appUserID = appUserIDRaw.isEmpty ? nil : appUserIDRaw
        Task { @MainActor in
            RevenueCatManager.shared.configure(appUserID: appUserID)
            call.resolve(["configured": true])
        }
    }

    @objc func logIn(_ call: CAPPluginCall) {
        let appUserID = call.getString("appUserID", "")
        guard !appUserID.isEmpty else {
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
        let period = call.getString("period", "monthly")
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
        Task { @MainActor [self] in
            let presented = PaywallPresenter.presentPaywall(from: repLockPresenter(for: self))
            if presented {
                call.resolve(["presented": true])
            } else {
                repLockReject(call, "Could not present paywall — no host view controller", code: "NO_HOST")
            }
        }
    }

    @objc func presentCustomerCenter(_ call: CAPPluginCall) {
        Task { @MainActor [self] in
            let presented = PaywallPresenter.presentCustomerCenter(from: repLockPresenter(for: self))
            if presented {
                call.resolve(["presented": true])
            } else {
                repLockReject(call, "Could not present customer center — no host view controller", code: "NO_HOST")
            }
        }
    }
}
