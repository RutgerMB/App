package com.replock.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    @PluginMethod
    public void getInstalled(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            Intent intent = new Intent(Intent.ACTION_MAIN, null);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> apps = pm.queryIntentActivities(intent, 0);
            JSArray result = new JSArray();

            for (ResolveInfo ri : apps) {
                if (ri.activityInfo == null) continue;
                String pkg = ri.activityInfo.packageName;
                if (pkg.equals(getContext().getPackageName())) continue;

                JSObject app = new JSObject();
                app.put("packageName", pkg);
                app.put("name", ri.loadLabel(pm).toString());
                result.put(app);
            }

            JSObject ret = new JSObject();
            ret.put("apps", result);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get installed apps", e);
        }
    }
}
