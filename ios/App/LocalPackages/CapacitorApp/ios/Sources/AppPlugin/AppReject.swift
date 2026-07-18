import Capacitor
import RepLockPluginBridge

/// Capacitor 8 SPM hides `reject` on Xcode 15.x; route through Obj-C bridge.
func appReject(_ call: CAPPluginCall, _ message: String, code: String? = nil) {
    RepLockRejectPluginCall(call, message, code)
}
