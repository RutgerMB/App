#import <Foundation/Foundation.h>

@class CAPPluginCall;

/// Reject a plugin call from Obj-C (CAPPluginCallError Swift inits are hidden on Xcode 15.4 + Capacitor 8 SPM).
void RepLockRejectPluginCall(CAPPluginCall *call, NSString *message, NSString *code);
