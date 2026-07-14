import NativePurchasesPlugin
// SPM module name is the target name (RepLockControlsPlugin), not the package product.
import RepLockControlsPlugin
import RepLockRevenueCatPlugin

public let isCapacitorApp = true

/// Call from AppDelegate if you need RevenueCat configured before the WebView loads.
public func configureRepLockRevenueCat(appUserID: String? = nil) {
    Task { @MainActor in
        RevenueCatManager.shared.configure(appUserID: appUserID)
    }
}
