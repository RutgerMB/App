package com.replock.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /** Calendar days included in the average baseline (matches iOS DeviceActivity daily max). */
    private static final int BASELINE_WINDOW_DAYS = 7;

    /** Local midnight for (days - 1) days ago → now. */
    private long[] lastDaysRangeMs(int days) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.add(Calendar.DAY_OF_YEAR, -(Math.max(1, days) - 1));
        return new long[] { cal.getTimeInMillis(), System.currentTimeMillis() };
    }

    private long[] todayRangeMs() {
        return lastDaysRangeMs(1);
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

            // Average daily over last 7 days (total ÷ 7). Honest baseline vs today-only.
            long[] range = lastDaysRangeMs(BASELINE_WINDOW_DAYS);
            Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(range[0], range[1]);
            long totalMs = 0;
            for (UsageStats s : stats.values()) {
                totalMs += s.getTotalTimeInForeground();
            }

            double avgHours = (totalMs / (1000.0 * 60.0 * 60.0)) / BASELINE_WINDOW_DAYS;
            double avgMinutes = (totalMs / (1000.0 * 60.0)) / BASELINE_WINDOW_DAYS;

            JSObject ret = new JSObject();
            ret.put("hours", avgHours);
            ret.put("minutes", avgMinutes);
            ret.put("windowDays", BASELINE_WINDOW_DAYS);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read screen time", e);
        }
    }

    /**
     * Per-app foreground minutes for today.
     * Optional `packageNames` filters to locked apps; otherwise returns top apps by usage.
     */
    @PluginMethod
    public void getDailyAppUsage(PluginCall call) {
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

            Set<String> filter = null;
            JSArray requested = call.getArray("packageNames");
            if (requested != null && requested.length() > 0) {
                filter = new HashSet<>();
                for (int i = 0; i < requested.length(); i++) {
                    String pkg = requested.getString(i);
                    if (pkg != null && !pkg.trim().isEmpty()) {
                        filter.add(pkg.trim());
                    }
                }
            }

            long[] range = todayRangeMs();
            Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(range[0], range[1]);

            List<JSObject> rows = new ArrayList<>();
            for (Map.Entry<String, UsageStats> entry : stats.entrySet()) {
                String packageName = entry.getKey();
                if (filter != null && !filter.contains(packageName)) continue;
                if (BlockerHelper.shouldIgnorePackage(packageName)) continue;

                long ms = entry.getValue().getTotalTimeInForeground();
                if (ms < 30_000L && filter == null) continue; // skip tiny noise when unfiltered

                double minutes = ms / (1000.0 * 60.0);
                if (minutes <= 0) continue;

                JSObject row = new JSObject();
                row.put("packageName", packageName);
                row.put("label", BlockerHelper.getAppLabel(getContext(), packageName));
                row.put("minutes", minutes);
                rows.add(row);
            }

            Collections.sort(rows, new Comparator<JSObject>() {
                @Override
                public int compare(JSObject a, JSObject b) {
                    return Double.compare(b.getDouble("minutes"), a.getDouble("minutes"));
                }
            });

            int limit = filter != null ? rows.size() : Math.min(rows.size(), 12);
            JSArray apps = new JSArray();
            for (int i = 0; i < limit; i++) {
                apps.put(rows.get(i));
            }

            JSObject ret = new JSObject();
            ret.put("apps", apps);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read per-app usage", e);
        }
    }
}
