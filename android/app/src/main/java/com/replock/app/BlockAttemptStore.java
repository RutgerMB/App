package com.replock.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Persists how many times the accessibility blocker intercepted a locked app today.
 */
public final class BlockAttemptStore {
    private static final String PREFS = "replock_block_attempts";
    private static final String KEY_DATE = "date";
    private static final String KEY_COUNTS = "counts";

    private BlockAttemptStore() {}

    private static String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static void ensureToday(SharedPreferences prefs) {
        String today = todayKey();
        String stored = prefs.getString(KEY_DATE, null);
        if (!today.equals(stored)) {
            prefs.edit().putString(KEY_DATE, today).putString(KEY_COUNTS, "{}").apply();
        }
    }

    public static void recordAttempt(Context context, String packageName) {
        if (packageName == null || packageName.isEmpty()) return;

        SharedPreferences prefs = prefs(context);
        ensureToday(prefs);

        try {
            JSONObject counts = new JSONObject(prefs.getString(KEY_COUNTS, "{}"));
            counts.put(packageName, counts.optInt(packageName, 0) + 1);
            prefs.edit().putString(KEY_COUNTS, counts.toString()).apply();
        } catch (Exception ignored) {
            // Best-effort counter — never crash the accessibility service.
        }
    }

    public static Map<String, Integer> getAttemptsToday(Context context) {
        SharedPreferences prefs = prefs(context);
        ensureToday(prefs);
        Map<String, Integer> result = new HashMap<>();
        try {
            JSONObject counts = new JSONObject(prefs.getString(KEY_COUNTS, "{}"));
            JSONArray names = counts.names();
            if (names == null) return result;
            for (int i = 0; i < names.length(); i++) {
                String pkg = names.optString(i);
                if (pkg == null || pkg.isEmpty()) continue;
                result.put(pkg, counts.optInt(pkg, 0));
            }
        } catch (Exception ignored) {
            // Return empty map on parse failure.
        }
        return result;
    }

    public static int getTotalAttemptsToday(Context context) {
        int total = 0;
        for (int count : getAttemptsToday(context).values()) {
            total += count;
        }
        return total;
    }
}
