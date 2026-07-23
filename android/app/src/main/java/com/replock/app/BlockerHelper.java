package com.replock.app;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityManager;

import java.util.List;

public final class BlockerHelper {
    private static final String SELF_PACKAGE = "com.replock.app";
    /** API 33+ — string literal avoids compileSdk symbol issues in some Android Studio setups */
    private static final String ACTION_ACCESSIBILITY_DETAILS_SETTINGS =
        "android.settings.ACCESSIBILITY_DETAILS_SETTINGS";

    private BlockerHelper() {}

    public static boolean isAccessibilityEnabled(Context context) {
        AccessibilityManager manager =
            (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (manager == null || !manager.isEnabled()) return false;

        String serviceId = new ComponentName(context, AppBlockerAccessibilityService.class)
            .flattenToString();

        List<AccessibilityServiceInfo> services =
            manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC);

        for (AccessibilityServiceInfo info : services) {
            if (info.getResolveInfo() == null || info.getResolveInfo().serviceInfo == null) continue;
            String id = new ComponentName(
                info.getResolveInfo().serviceInfo.packageName,
                info.getResolveInfo().serviceInfo.name
            ).flattenToString();
            if (serviceId.equals(id)) return true;
        }
        return false;
    }

    public static void openAccessibilitySettings(Context context) {
        ComponentName component = new ComponentName(context, AppBlockerAccessibilityService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            try {
                Intent details = new Intent(ACTION_ACCESSIBILITY_DETAILS_SETTINGS);
                details.putExtra(Intent.EXTRA_COMPONENT_NAME, component);
                details.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(details);
                return;
            } catch (Exception ignored) {
                // Fall through to the general accessibility list.
            }
        }

        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    public static boolean shouldIgnorePackage(String packageName) {
        if (TextUtils.isEmpty(packageName)) return true;
        if (SELF_PACKAGE.equals(packageName)) return true;
        if (packageName.startsWith("com.android.systemui")) return true;
        if (packageName.startsWith("com.google.android.inputmethod")) return true;
        if (packageName.equals("com.android.settings")) return true;
        // Samsung One UI / Knox / launchers — avoid false blocks when switching apps
        if (packageName.startsWith("com.samsung.android.app.cocktailbarservice")) return true;
        if (packageName.startsWith("com.samsung.android.honeyboard")) return true;
        if (packageName.equals("com.sec.android.app.launcher")) return true;
        if (packageName.equals("com.samsung.android.launcher")) return true;
        if (packageName.equals("com.samsung.android.app.telephonyui")) return true;
        if (packageName.equals("com.android.launcher")) return true;
        if (packageName.equals("com.android.launcher3")) return true;
        if (packageName.equals("com.google.android.apps.nexuslauncher")) return true;
        if (packageName.equals("com.google.android.permissioncontroller")) return true;
        if (packageName.equals("com.google.android.packageinstaller")) return true;
        if (packageName.equals("com.android.permissioncontroller")) return true;
        if (packageName.equals("com.android.vending")) return true;
        return false;
    }

    public static String getAppLabel(Context context, String packageName) {
        try {
            PackageManager pm = context.getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            CharSequence label = pm.getApplicationLabel(info);
            return label != null ? label.toString() : packageName;
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }
}
