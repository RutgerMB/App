import Foundation
import Capacitor
import RepLockPluginBridge

@objc(AppLauncherPlugin)
public class AppLauncherPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppLauncherPlugin"
    public let jsName = "AppLauncher"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canOpenUrl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openUrl", returnType: CAPPluginReturnPromise)
    ]

    @objc func canOpenUrl(_ call: CAPPluginCall) {
        let urlString = call.getString("url", "")
        guard !urlString.isEmpty else {
            appLauncherReject(call, "Must supply a URL")
            return
        }

        guard let url = URL.init(string: urlString) else {
            appLauncherReject(call, "Invalid URL")
            return
        }

        DispatchQueue.main.async {
            let canOpen = UIApplication.shared.canOpenURL(url)

            call.resolve([
                "value": canOpen
            ])
        }
    }

    @objc func openUrl(_ call: CAPPluginCall) {
        let urlString = call.getString("url", "")
        guard !urlString.isEmpty else {
            appLauncherReject(call, "Must supply a URL")
            return
        }

        guard let url = URL.init(string: urlString) else {
            appLauncherReject(call, "Invalid URL")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { (completed) in
                call.resolve([
                    "completed": completed
                ])
            }
        }
    }
}
