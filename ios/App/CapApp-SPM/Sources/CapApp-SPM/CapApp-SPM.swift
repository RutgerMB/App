import NativePurchasesPlugin
// SPM module name is the target name (RepLockControlsPlugin), not the package product.
import RepLockControlsPlugin
import RepLockRevenueCatPlugin

public let isCapacitorApp: Bool = {
    CapAppLocalPlugins.touch()
    return true
}
// CAP_PLUGIN_FORCE_LINK
enum CapAppLocalPlugins {
    static func touch() {
        _ = RepLockControlsPlugin.self
        _ = NativePurchasesPlugin.self
        _ = RepLockRevenueCatPlugin.self
    }
}

/// Call from AppDelegate if you need RevenueCat configured before the WebView loads.
public func configureRepLockRevenueCat(appUserID: String? = nil) {
    Task { @MainActor in
        RevenueCatManager.shared.configure(appUserID: appUserID)
    }
}
