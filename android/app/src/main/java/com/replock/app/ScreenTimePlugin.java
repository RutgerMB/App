package com.replock.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Calendar;
import java.util.Map;

@CapacitorPlugin(name = "ScreenTime")
public class ScreenTimePlugin extends Plugin {

    private boolean hasUsagePermission() {
        Context ctx = getContext();
        AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) return false;
        int mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            ctx.getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasUsagePermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open usage access settings", e);
        }
    }

    @PluginMethod
    public void getDailyScreenTimeHours(PluginCall call) {
        if (!hasUsagePermission()) {
            call.reject("Usage access not granted");
            return;
        }
        try {
            UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                call.reject("UsageStatsManager unavailable");
                return;
            }

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            long start = cal.getTimeInMillis();
            long end = System.currentTimeMillis();

            Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(start, end);
            long totalMs = 0;
            for (UsageStats s : stats.values()) {
                totalMs += s.getTotalTimeInForeground();
            }

            JSObject ret = new JSObject();
            ret.put("hours", totalMs / (1000.0 * 60.0 * 60.0));
            ret.put("minutes", totalMs / (1000.0 * 60.0));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read screen time", e);
        }
    }
}
