import UIKit
import Capacitor

/// Capacitor 8 SPM binaries built for Xcode 26 hide `reject` and `CAPBridgeProtocol.viewController`
/// when compiling with Xcode 15.x. These helpers use APIs that remain visible.
extension CAPPluginCall {
    func replockReject(_ message: String, code: String? = nil) {
        errorHandler(CAPPluginCallError(message: message, code: code, error: nil, data: nil))
    }
}

enum RepLockPluginUI {
    static func viewController(for plugin: CAPPlugin) -> UIViewController? {
        // CapacitorBridge.viewController is not visible through CAPBridgeProtocol on Xcode 15.x + Cap 8 SPM.
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
}
