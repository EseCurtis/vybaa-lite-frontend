package com.vybaa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

public final class GoalAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(GoalAlarmScheduler.EXTRA_ALARM_ID);
        if (alarmId == null) return;
        GoalAlarmPayload payload = GoalAlarmStore.find(context, alarmId);
        if (payload == null) return;

        Intent serviceIntent = GoalAlarmRingingService.createIntent(context, payload);
        ContextCompat.startForegroundService(context, serviceIntent);
    }
}
