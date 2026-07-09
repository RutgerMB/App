import UIKit
import Capacitor
import FamilyControls

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
        call.resolve([
            "authorized": AuthorizationManager.isAuthorized(),
            "status": AuthorizationManager.statusLabel(),
        ])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.replockReject("Family Controls requires iOS 16+")
            return
        }

        Task { @MainActor in
            do {
                try await AuthorizationManager.requestAuthorization()
                call.resolve([
                    "authorized": AuthorizationManager.isAuthorized(),
                    "status": AuthorizationManager.statusLabel(),
                ])
            } catch {
                call.replockReject("Authorization failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func presentActivityPicker(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.replockReject("Family Controls requires iOS 16+")
            return
        }

        guard AuthorizationManager.isAuthorized() else {
            call.replockReject("Screen Time authorization required")
            return
        }

        let store = SelectionStore.shared
        let initial = store.loadSelection()

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.replockReject("Plugin unavailable")
                return
            }

            guard let presenter = RepLockPluginUI.viewController(for: self) else {
                call.replockReject("Unable to present app picker")
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
            call.replockReject("Family Controls requires iOS 16+")
            return
        }

        guard AuthorizationManager.isAuthorized() else {
            call.replockReject("Screen Time authorization required")
            return
        }

        guard let rulesArray = call.getArray("rules") else {
            call.replockReject("rules array required")
            return
        }

        let rules: [IosBlockRule] = rulesArray.compactMap { item in
            guard let dict = item as? JSObject else { return nil }
            guard let tokenId = dict["tokenId"] as? String else { return nil }
            let blocked = dict["blocked"] as? Bool ?? true
            let unlockedUntil = dict["unlockedUntil"] as? Double ?? 0
            return IosBlockRule(tokenId: tokenId, blocked: blocked, unlockedUntil: unlockedUntil)
        }

        let selection = SelectionStore.shared.loadSelection()
        ShieldManager.applyRules(rules, selection: selection)
        call.resolve(["ok": true])
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
        // Phase 3: Device Activity Report extension will write totals to App Group.
        call.replockReject(
            "Screen time totals require a Device Activity Report extension (not yet configured)",
            code: "UNIMPLEMENTED"
        )
    }
}
