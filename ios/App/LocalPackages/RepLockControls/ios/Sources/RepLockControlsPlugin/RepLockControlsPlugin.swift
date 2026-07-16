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
        CAPPluginMethod(name: "presentSelectedAppsSheet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setDisplayNames", returnType: CAPPluginReturnPromise),
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
            repLockReject(call, "Family Controls requires iOS 16+", code: "UNSUPPORTED")
            return
        }

        // Hop to main immediately so Face ID / the system sheet can present from
        // the same UI turn as the JS user gesture (Capacitor bridge may call off-main).
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
                let mapped = Self.mapAuthorizationFailure(error, status: refreshed.status)
                print("[RepLockControls] requestAuthorization failed code=\(mapped.code) status=\(refreshed.status) err=\(error)")
                repLockReject(call, mapped.message, code: mapped.code)
            }
        }
    }

    @available(iOS 16.0, *)
    private static func mapAuthorizationFailure(_ error: Error, status: String) -> (code: String, message: String) {
        if let requestError = error as? AuthorizationRequestError {
            return ("NOT_ACTIVE", "Authorization failed: \(requestError.localizedDescription) (status=\(status))")
        }

        if let fcError = error as? FamilyControlsError {
            let code: String
            switch fcError {
            case .authorizationCanceled:
                code = "CANCELED"
            case .restricted:
                code = "RESTRICTED"
            case .unavailable:
                code = "UNAVAILABLE"
            case .authenticationMethodUnavailable:
                code = "NO_PASSCODE"
            case .invalidAccountType:
                code = "INVALID_ACCOUNT"
            case .authorizationConflict:
                code = "CONFLICT"
            case .networkError:
                code = "NETWORK"
            case .invalidArgument:
                code = "INVALID_ARGUMENT"
            @unknown default:
                code = "FAILED"
            }
            return (code, "Authorization failed: \(fcError.localizedDescription) (status=\(status))")
        }

        if status == "denied" {
            return ("DENIED", "Authorization failed: \(error.localizedDescription) (status=\(status))")
        }
        if status == "notDetermined" {
            return ("NOT_DETERMINED", "Authorization failed: \(error.localizedDescription) (status=\(status))")
        }
        return ("FAILED", "Authorization failed: \(error.localizedDescription) (status=\(status))")
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

            // After the system picker, a native confirmation sheet shows
            // Label(token) (real name+icon). Only user nicknames are bridged to JS.
            ActivityPickerPresenter.shared.present(
                from: presenter,
                initialSelection: initial
            ) { selection, displayNames in
                store.saveDisplayNames(displayNames)
                store.saveSelection(selection)
                call.resolve([
                    "count": selection.applicationTokens.count,
                ])
            }
        }
    }

    /// Native sheet with FamilyControls `Label(token)` + nickname editors.
    @objc func presentSelectedAppsSheet(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            repLockReject(call, "Family Controls requires iOS 16+")
            return
        }

        Task { @MainActor in
            guard AuthorizationManager.isAuthorized() else {
                repLockReject(call, "Screen Time authorization required")
                return
            }

            guard let presenter = repLockPresenter(for: self) else {
                repLockReject(call, "Unable to present apps sheet")
                return
            }

            let store = SelectionStore.shared
            let selection = store.loadSelection()
            ActivityPickerPresenter.shared.presentReview(
                from: presenter,
                selection: selection
            ) { displayNames in
                store.saveDisplayNames(displayNames)
                call.resolve([
                    "count": selection.applicationTokens.count,
                    "apps": store.selectedAppsPayload(from: selection),
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

    /// Persist user nicknames for opaque tokens (Apple never exposes real names to JS).
    @objc func setDisplayNames(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["ok": true])
            return
        }

        // Cap 8 SPM on Xcode 15.x requires the two-arg getObject(_:_:); use options
        // for optional presence (same pattern as RevenueCat optionalObject).
        guard let raw = call.options["names"] as? JSObject else {
            repLockReject(call, "names object required")
            return
        }

        let store = SelectionStore.shared
        var merged = store.loadDisplayNames()
        for (id, value) in raw {
            let name: String
            if let s = value as? String {
                name = s
            } else if let n = value as? NSNumber {
                name = n.stringValue
            } else {
                continue
            }
            let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                merged.removeValue(forKey: id)
            } else {
                merged[id] = trimmed
            }
        }
        store.saveDisplayNames(merged)
        call.resolve(["ok": true])
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

    /// Reads today's Screen Time total from the App Group after hosting a
    /// `DeviceActivityReport` probe (extension writes minutes to shared defaults).
    /// Requires the `RepLockDeviceActivityReport` target embedded in the app.
    @objc func getDailyScreenTimeHours(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            repLockReject(call, "iOS 16+ required for screen time totals", code: "UNSUPPORTED")
            return
        }

        let force = call.getBool("force") ?? false
        Task { @MainActor in
            let auth = AuthorizationManager.refreshStatus()
            guard auth.authorized else {
                repLockReject(call, "Screen Time authorization required", code: "AUTH_REQUIRED")
                return
            }

            let presenter = repLockPresenter(for: self)
            let snap = await ScreenTimeReportHost.refresh(from: presenter, force: force)
            guard let snap else {
                repLockReject(
                    call,
                    "No screen time report yet. Embed RepLockDeviceActivityReport and approve Family Controls (see IOS_SETUP.md).",
                    code: "NO_DATA"
                )
                return
            }

            call.resolve([
                "hours": snap.hours,
                "minutes": snap.minutesComponent,
                "totalMinutes": snap.totalMinutes,
                "hoursWhole": snap.hoursComponent,
                "day": snap.day,
                "updatedAt": snap.updatedAt.timeIntervalSince1970,
                "source": "deviceActivityReport",
            ])
        }
    }
}
