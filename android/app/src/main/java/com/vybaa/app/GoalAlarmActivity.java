package com.vybaa.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class GoalAlarmActivity extends Activity {
    private String alarmId;
    private String route;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setShowWhenLocked(true);
        setTurnScreenOn(true);
        alarmId = getIntent().getStringExtra(GoalAlarmScheduler.EXTRA_ALARM_ID);
        route = getIntent().getStringExtra(GoalAlarmScheduler.EXTRA_ROUTE);
        if (alarmId != null) {
            GoalAlarmPayload payload = GoalAlarmStore.find(this, alarmId);
            if (payload != null) GoalAlarmStore.recordAction(this, payload, "opened");
        }
        String title = getIntent().getStringExtra(GoalAlarmScheduler.EXTRA_TITLE);
        String body = getIntent().getStringExtra(GoalAlarmScheduler.EXTRA_BODY);
        setContentView(buildContent(title == null ? "Goal reminder" : title, body == null ? "" : body));
    }

    private LinearLayout buildContent(String title, String body) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(48, 64, 48, 64);
        root.setBackgroundColor(Color.rgb(13, 15, 25));

        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(28);
        titleView.setGravity(Gravity.CENTER);
        root.addView(titleView, matchWidthWrapHeight());

        TextView bodyView = new TextView(this);
        bodyView.setText(body);
        bodyView.setTextColor(Color.rgb(183, 187, 205));
        bodyView.setTextSize(17);
        bodyView.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bodyParams = matchWidthWrapHeight();
        bodyParams.setMargins(0, 24, 0, 48);
        root.addView(bodyView, bodyParams);

        Button stop = new Button(this);
        stop.setText("Stop");
        stop.setOnClickListener(view -> {
            sendAction(GoalAlarmActionReceiver.ACTION_STOP);
            openGoal();
        });
        root.addView(stop, matchWidthWrapHeight());

        Button snooze = new Button(this);
        snooze.setText("Snooze 10 minutes");
        snooze.setOnClickListener(view -> {
            sendAction(GoalAlarmActionReceiver.ACTION_SNOOZE);
            finishAndRemoveTask();
        });
        LinearLayout.LayoutParams snoozeParams = matchWidthWrapHeight();
        snoozeParams.setMargins(0, 20, 0, 0);
        root.addView(snooze, snoozeParams);
        return root;
    }

    private LinearLayout.LayoutParams matchWidthWrapHeight() {
        return new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
    }

    private void openGoal() {
        if (route == null) {
            finishAndRemoveTask();
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://vybaa.app" + route));
        intent.setPackage(getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(intent);
        finishAndRemoveTask();
    }

    private void sendAction(String action) {
        if (alarmId == null) return;
        Intent intent = new Intent(this, GoalAlarmActionReceiver.class);
        intent.setAction(action);
        intent.putExtra(GoalAlarmScheduler.EXTRA_ALARM_ID, alarmId);
        sendBroadcast(intent);
    }
}
