#import "RepLockPluginBridge.h"
@import Capacitor;

void RepLockRejectPluginCall(CAPPluginCall *call, NSString *message, NSString *code) {
    if (call == nil) {
        return;
    }

    NSDictionary *emptyData = @{};
    CAPPluginCallError *pluginError = [[CAPPluginCallError alloc] initWithMessage:message
                                                                              code:code
                                                                             error:nil
                                                                              data:emptyData];
    if (call.errorHandler != nil) {
        call.errorHandler(pluginError);
    }
}
