package com.replock.app;

import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class BlockerOverlayActivity extends AppCompatActivity {
    public static final String EXTRA_PACKAGE_NAME = "blocked_package";
    public static final String EXTRA_APP_LABEL = "blocked_app_label";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_blocker_overlay);

        String appLabel = getIntent().getStringExtra(EXTRA_APP_LABEL);
        if (appLabel == null || appLabel.isEmpty()) {
            appLabel = getString(R.string.blocker_default_app_name);
        }

        TextView title = findViewById(R.id.blocker_title);
        TextView subtitle = findViewById(R.id.blocker_subtitle);
        Button openRepLock = findViewById(R.id.blocker_open_replock);
        Button goHome = findViewById(R.id.blocker_go_home);

        title.setText(getString(R.string.blocker_title, appLabel));
        subtitle.setText(R.string.blocker_subtitle);

        openRepLock.setOnClickListener(v -> {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });

        goHome.setOnClickListener(v -> {
            Intent home = new Intent(Intent.ACTION_MAIN);
            home.addCategory(Intent.CATEGORY_HOME);
            home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(home);
            finish();
        });
    }

    @Override
    public void onBackPressed() {
        Intent home = new Intent(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(home);
        finish();
    }
}
