import Capacitor

/// Thin wrapper so call sites stay readable; uses Cap 8 `reject` (Xcode 26+).
func rcReject(_ call: CAPPluginCall, _ message: String, code: String? = nil) {
    call.reject(message, code)
}
