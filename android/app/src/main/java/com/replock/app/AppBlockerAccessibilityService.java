package com.replock.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

public class AppBlockerAccessibilityService extends AccessibilityService {
    private String lastBlockedPackage = "";
    private long lastBlockedAt = 0L;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkg = event.getPackageName();
        if (pkg == null) return;

        String packageName = pkg.toString();
        if (BlockerHelper.shouldIgnorePackage(packageName)) return;
        if (!BlockerRulesStore.shouldBlock(this, packageName)) return;

        long now = System.currentTimeMillis();
        if (packageName.equals(lastBlockedPackage) && now - lastBlockedAt < 1500L) {
            return;
        }

        lastBlockedPackage = packageName;
        lastBlockedAt = now;

        String appLabel = BlockerHelper.getAppLabel(this, packageName);
        Intent intent = new Intent(this, BlockerOverlayActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra(BlockerOverlayActivity.EXTRA_PACKAGE_NAME, packageName);
        intent.putExtra(BlockerOverlayActivity.EXTRA_APP_LABEL, appLabel);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {
        // No-op
    }
}
