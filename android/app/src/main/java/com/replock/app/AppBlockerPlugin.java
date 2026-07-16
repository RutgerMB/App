package com.replock.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Map;

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

    /** Today's blocked-app open attempts (accessibility intercepts). */
    @PluginMethod
    public void getBlockAttemptsToday(PluginCall call) {
        try {
            Map<String, Integer> counts = BlockAttemptStore.getAttemptsToday(getContext());
            JSArray apps = new JSArray();
            for (Map.Entry<String, Integer> entry : counts.entrySet()) {
                JSObject row = new JSObject();
                row.put("packageName", entry.getKey());
                row.put("label", BlockerHelper.getAppLabel(getContext(), entry.getKey()));
                row.put("count", entry.getValue());
                apps.put(row);
            }
            JSObject ret = new JSObject();
            ret.put("total", BlockAttemptStore.getTotalAttemptsToday(getContext()));
            ret.put("apps", apps);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read block attempts", e);
        }
    }
}
