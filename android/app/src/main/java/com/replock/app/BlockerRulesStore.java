package com.replock.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public final class BlockerRulesStore {
    private static final String PREFS = "replock_blocker_rules";
    private static final String KEY_PACKAGES = "blocked_packages";
    private static final String KEY_UNLOCK_PREFIX = "unlock_";

    private BlockerRulesStore() {}

    public static void applyRules(Context context, JSONArray rules) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.clear();

        Set<String> packages = new HashSet<>();
        if (rules != null) {
            for (int i = 0; i < rules.length(); i++) {
                JSONObject rule = rules.optJSONObject(i);
                if (rule == null) continue;

                String packageName = rule.optString("packageName", "").trim();
                if (packageName.isEmpty()) continue;

                boolean blocked = rule.optBoolean("blocked", true);
                long unlockedUntil = rule.optLong("unlockedUntil", 0L);

                if (!blocked) {
                    packages.add(packageName);
                    if (unlockedUntil > 0L) {
                        editor.putLong(KEY_UNLOCK_PREFIX + packageName, unlockedUntil);
                    }
                } else {
                    packages.add(packageName);
                }
            }
        }

        editor.putStringSet(KEY_PACKAGES, packages);
        editor.apply();
    }

    public static Set<String> getBlockedPackages(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Set<String> stored = prefs.getStringSet(KEY_PACKAGES, null);
        return stored != null ? new HashSet<>(stored) : new HashSet<>();
    }

    public static boolean shouldBlock(Context context, String packageName) {
        if (packageName == null || packageName.isEmpty()) return false;

        Set<String> packages = getBlockedPackages(context);
        if (!packages.contains(packageName)) return false;

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long unlockedUntil = prefs.getLong(KEY_UNLOCK_PREFIX + packageName, 0L);
        if (unlockedUntil > System.currentTimeMillis()) {
            return false;
        }

        return true;
    }

    public static Map<String, Long> getUnlockTimes(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Map<String, Long> result = new HashMap<>();
        for (String packageName : getBlockedPackages(context)) {
            long until = prefs.getLong(KEY_UNLOCK_PREFIX + packageName, 0L);
            if (until > 0L) {
                result.put(packageName, until);
            }
        }
        return result;
    }
}
