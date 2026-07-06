package com.replock.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InstalledAppsPlugin.class);
        registerPlugin(AppBlockerPlugin.class);
        registerPlugin(ScreenTimePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        Bridge bridge = getBridge();
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
