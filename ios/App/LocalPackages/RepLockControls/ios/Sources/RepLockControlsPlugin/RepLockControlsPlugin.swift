import UIKit
import Capacitor
import FamilyControls
import RepLockPluginBridge

// MARK: - Xcode 15.4 + Capacitor 8 SPM helpers
// Capacitor 8 SPM hides `reject` and CAPPluginCallError Swift inits on Xcode 15.x.
// RepLockPluginBridge constructs CAPPluginCallError via Obj-C init:message:code:error:data:.

private func repLockReject(_ call: CAPPluginCall, _ message: String, code: String? = nil) {
    RepLockRejectPluginCall(call, message, code)
}

private func repLockPresenter(for plugin: CAPPlugin) -> UIViewController? {
    if let bridgeObject = plugin.bridge as? NSObject,
       let vc = bridgeObject.value(forKey: "viewController") as? UIViewController {
        return vc
    }

    let scenes = UIApplication.shared.connectedScenes
    let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
    var root = windowScene?.windows.first { $0.isKeyWindow }?.rootViewController
    while let presented = root?.presentedViewController {
        root = presented
    }
    return root
}

private func repLockRules(from call: CAPPluginCall) -> [IosBlockRule]? {
    guard let raw = call.options["rules"] as? [Any] else { return nil }
    let rules: [IosBlockRule] = raw.compactMap { item in
        guard let dict = item as? [String: Any] else { return nil }
        guard let tokenId = dict["tokenId"] as? String else { return nil }
        let blocked = dict["blocked"] as? Bool ?? true
        let unlockedUntil = dict["unlockedUntil"] as? Double ?? 0
        return IosBlockRule(tokenId: tokenId, blocked: blocked, unlockedUntil: unlockedUntil)
    }
    return rules
}

@objc(RepLockControlsPlugin)
public class RepLockControlsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RepLockControlsPlugin"
    public let jsName = "RepLockControls"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentActivityPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "applyRules", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearShields", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDailyScreenTimeHours", returnType: CAPPluginReturnPromise),
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 16.0, *) {
            call.resolve(["supported": true])
        } else {
            call.resolve(["supported": false])
        }
    }

    @objc func checkAuthorization(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["authorized": false, "status": "unsupported"])
            return
        }
        // FamilyControls AuthorizationCenter must be read on the main actor.
        Task { @MainActor in
            let refreshed = AuthorizationManager.refreshStatus()
            call.resolve([
                "authorized": refreshed.authorized,
                "status": refreshed.status,
            ])
        }
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            repLockReject(call, "Family Controls requires iOS 16+")
            return
        }

        Task { @MainActor in
            do {
                let result = try await AuthorizationManager.requestAuthorization()
                call.resolve([
                    "authorized": result.authorized,
                    "status": result.status,
                ])
            } catch {
                // Dialog may error while Settings already shows approved — re-check first.
                let refreshed = AuthorizationManager.refreshStatus()
                if refreshed.authorized {
                    call.resolve([
                        "authorized": true,
                        "status": refreshed.status,
                    ])
                    return
                }
                let status = refreshed.status
                let code = status == "denied" ? "DENIED" : (status == "notDetermined" ? "NOT_DETERMINED" : "FAILED")
                repLockReject(
                    call,
                    "Authorization failed: \(error.localizedDescription) (status=\(status))",
                    code: code
                )
            }
        }
    }

    @objc func presentActivityPicker(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            repLockReject(call, "Family Controls requires iOS 16+")
            return
        }

        Task { @MainActor in
            guard AuthorizationManager.isAuthorized() else {
                repLockReject(call, "Screen Time authorization required")
                return
            }

            let store = SelectionStore.shared
            let initial = store.loadSelection()

            guard let presenter = repLockPresenter(for: self) else {
                repLockReject(call, "Unable to present app picker")
                return
            }

            ActivityPickerPresenter.shared.present(
                from: presenter,
                initialSelection: initial
            ) { selection in
                store.saveSelection(selection)
                call.resolve([
                    "count": selection.applicationTokens.count,
                ])
            }
        }
    }

    @objc func getSelectedApps(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["apps": []])
            return
        }

        let selection = SelectionStore.shared.loadSelection()
        let apps = SelectionStore.shared.selectedAppsPayload(from: selection)
        call.resolve(["apps": apps])
    }

    @objc func applyRules(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            repLockReject(call, "Family Controls requires iOS 16+")
            return
        }

        Task { @MainActor in
            guard AuthorizationManager.isAuthorized() else {
                repLockReject(call, "Screen Time authorization required")
                return
            }

            guard let rules = repLockRules(from: call) else {
                repLockReject(call, "rules array required")
                return
            }

            let selection = SelectionStore.shared.loadSelection()
            ShieldManager.applyRules(rules, selection: selection)
            call.resolve(["ok": true])
        }
    }

    @objc func clearShields(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["ok": true])
            return
        }
        ShieldManager.clearShields()
        call.resolve(["ok": true])
    }

    @objc func getDailyScreenTimeHours(_ call: CAPPluginCall) {
        repLockReject(
            call,
            "Screen time totals require a Device Activity Report extension (not yet configured)",
            code: "UNIMPLEMENTED"
        )
    }
}
