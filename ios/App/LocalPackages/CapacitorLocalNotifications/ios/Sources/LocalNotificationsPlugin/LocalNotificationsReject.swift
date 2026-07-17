import Capacitor
import RepLockPluginBridge

/// Capacitor 8 SPM hides `reject` on Xcode 15.x; route through Obj-C bridge.
func lnReject(_ call: CAPPluginCall, _ message: String, code: String? = nil) {
    RepLockRejectPluginCall(call, message, code)
}

/// Prefer the Capgo-safe `getArray(_: [])` overload; fall back to `options`.
func lnJSObjectArray(_ call: CAPPluginCall, _ key: String) -> [JSObject]? {
    if let arr = call.getArray(key, []) as? [JSObject], !arr.isEmpty || call.options[key] != nil {
        return arr
    }
    if let arr = call.options[key] as? [JSObject] {
        return arr
    }
    guard let raw = call.options[key] as? [Any] else { return nil }
    let mapped: [JSObject] = raw.compactMap { item in
        if let obj = item as? JSObject { return obj }
        if let dict = item as? [String: Any] {
            var obj = JSObject()
            for (k, v) in dict {
                if let js = v as? JSValue {
                    obj[k] = js
                }
            }
            return obj
        }
        return nil
    }
    return mapped
}