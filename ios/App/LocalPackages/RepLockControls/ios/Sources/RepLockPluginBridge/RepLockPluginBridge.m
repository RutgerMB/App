#import "RepLockPluginBridge.h"
@import Capacitor;

// Uses @objc(init:code:error:data:) — NOT initWithMessage:code:error:data: (wrong selector on Cap 8 SPM).
// Last-resort fallback if this still fails on Xcode 15.4: resolve with
//   { "__repLockError": true, "message": "...", "code": "..." }
// and handle __repLockError in JS plugin wrappers (treat as reject).
void RepLockRejectPluginCall(CAPPluginCall *call, NSString *message, NSString *code) {
    if (call == nil) {
        return;
    }

    NSDictionary *emptyData = @{};
    CAPPluginCallError *pluginError = [[CAPPluginCallError alloc] init:message
                                                                   code:code
                                                                  error:nil
                                                                   data:emptyData];
    if (call.errorHandler != nil) {
        call.errorHandler(pluginError);
    }
}
