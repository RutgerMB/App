package com.replock.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppBlocker")
public class AppBlockerPlugin extends Plugin {

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        boolean accessibility = BlockerHelper.isAccessibilityEnabled(getContext());
        ret.put("supported", true);
        ret.put("accessibility", accessibility);
        ret.put("ready", accessibility);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            BlockerHelper.openAccessibilitySettings(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open accessibility settings", e);
        }
    }

    @PluginMethod
    public void applyRules(PluginCall call) {
        try {
            JSArray rules = call.getArray("rules");
            BlockerRulesStore.applyRules(getContext(), rules);
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to apply blocker rules", e);
        }
    }
}
