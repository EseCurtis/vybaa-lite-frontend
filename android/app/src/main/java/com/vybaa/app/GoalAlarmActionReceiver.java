package com.vybaa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public final class GoalAlarmActionReceiver extends BroadcastReceiver {
    static final String ACTION_SNOOZE = "com.vybaa.app.goalAlarm.SNOOZE";
    static final String ACTION_STOP = "com.vybaa.app.goalAlarm.STOP";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(GoalAlarmScheduler.EXTRA_ALARM_ID);
        if (alarmId == null) return;
        GoalAlarmRingingService.stop(context);

        if (ACTION_SNOOZE.equals(intent.getAction())) {
            GoalAlarmPayload payload = GoalAlarmStore.find(context, alarmId);
            if (payload == null) return;
            GoalAlarmStore.recordAction(context, payload, "snoozed");
            long snoozedAt = System.currentTimeMillis() + payload.snoozeMinutes * 60_000L;
            GoalAlarmPayload snoozed = payload.withFireAt(snoozedAt);
            GoalAlarmStore.upsert(context, snoozed);
            if (GoalAlarmScheduler.canScheduleExactAlarms(context)) {
                try {
                    GoalAlarmScheduler.schedule(context, snoozed);
                } catch (SecurityException ignored) {
                    GoalAlarmStore.remove(context, alarmId);
                }
            } else {
                GoalAlarmStore.remove(context, alarmId);
            }
            return;
        }

        GoalAlarmPayload payload = GoalAlarmStore.find(context, alarmId);
        if (payload != null) GoalAlarmStore.recordAction(context, payload, "stopped");
        GoalAlarmScheduler.cancel(context, alarmId);
        GoalAlarmStore.remove(context, alarmId);
    }
}
