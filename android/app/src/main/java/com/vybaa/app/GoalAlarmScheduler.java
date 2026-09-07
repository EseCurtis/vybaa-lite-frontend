package com.vybaa.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class GoalAlarmScheduler {
    static final String EXTRA_ALARM_ID = "goalAlarmId";
    static final String EXTRA_BODY = "goalAlarmBody";
    static final String EXTRA_ROUTE = "goalAlarmRoute";
    static final String EXTRA_SNOOZE_MINUTES = "goalAlarmSnoozeMinutes";
    static final String EXTRA_TITLE = "goalAlarmTitle";

    private GoalAlarmScheduler() {}

    static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return manager.canScheduleExactAlarms();
    }

    static void cancel(Context context, String alarmId) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent operation = operationIntent(context, alarmId, PendingIntent.FLAG_NO_CREATE);
        if (operation != null) manager.cancel(operation);
    }

    static void cancelAll(Context context) {
        for (GoalAlarmPayload payload : GoalAlarmStore.load(context)) {
            cancel(context, payload.id);
        }
        GoalAlarmStore.clear(context);
        GoalAlarmRingingService.stop(context);
    }

    static Intent exactAlarmSettingsIntent(Context context) {
        Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
        intent.setData(Uri.parse("package:" + context.getPackageName()));
        return intent;
    }

    static List<String> reconcile(
        Context context,
        List<GoalAlarmPayload> desired,
        Set<String> cancelSnoozesForGoalIds
    ) {
        long now = System.currentTimeMillis();
        Map<String, GoalAlarmPayload> previousById = new HashMap<>();
        for (GoalAlarmPayload payload : GoalAlarmStore.load(context)) {
            previousById.put(payload.id, payload);
        }
        Set<String> desiredIds = new HashSet<>();
        for (GoalAlarmPayload payload : desired) {
            if (payload.fireAtMillis > now) desiredIds.add(payload.id);
        }
        List<GoalAlarmPayload> retainedSnoozes = new ArrayList<>();
        for (GoalAlarmPayload previous : previousById.values()) {
            if (desiredIds.contains(previous.id)) continue;
            if (previous.snoozed
                && previous.fireAtMillis > now
                && !cancelSnoozesForGoalIds.contains(previous.goalId)) {
                retainedSnoozes.add(previous);
                continue;
            }
            cancel(context, previous.id);
        }

        List<GoalAlarmPayload> scheduled = new ArrayList<>(retainedSnoozes);
        for (GoalAlarmPayload payload : desired) {
            if (payload.fireAtMillis <= now) continue;
            GoalAlarmPayload previous = previousById.get(payload.id);
            if (previous == null || !previous.hasSameSchedule(payload)) {
                cancel(context, payload.id);
            }
            try {
                schedule(context, payload);
                scheduled.add(payload);
            } catch (SecurityException ignored) {
                // The server keeps push fallback active for any ID omitted here.
            }
        }
        GoalAlarmStore.save(context, scheduled);

        List<String> ids = new ArrayList<>();
        for (GoalAlarmPayload payload : scheduled) ids.add(payload.id);
        return ids;
    }

    static void rescheduleStored(Context context) {
        if (!canScheduleExactAlarms(context)) return;
        List<GoalAlarmPayload> scheduled = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (GoalAlarmPayload payload : GoalAlarmStore.load(context)) {
            if (payload.fireAtMillis <= now) continue;
            try {
                schedule(context, payload);
                scheduled.add(payload);
            } catch (SecurityException ignored) {
                // Keep only alarms Android accepted after reboot/timezone changes.
            }
        }
        GoalAlarmStore.save(context, scheduled);
    }

    static void schedule(Context context, GoalAlarmPayload payload) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent operation = operationIntent(context, payload.id, PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent show = showIntent(context, payload);
        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(payload.fireAtMillis, show);
        manager.setAlarmClock(clockInfo, operation);
    }

    private static void addPayload(Intent intent, GoalAlarmPayload payload) {
        intent.putExtra(EXTRA_ALARM_ID, payload.id);
        intent.putExtra(EXTRA_BODY, payload.body);
        intent.putExtra(EXTRA_ROUTE, payload.route);
        intent.putExtra(EXTRA_SNOOZE_MINUTES, payload.snoozeMinutes);
        intent.putExtra(EXTRA_TITLE, payload.title);
    }

    private static PendingIntent operationIntent(Context context, String alarmId, int modeFlag) {
        Intent intent = new Intent(context, GoalAlarmReceiver.class);
        intent.setData(Uri.parse("vybaa://goal-alarm/" + Uri.encode(alarmId)));
        intent.putExtra(EXTRA_ALARM_ID, alarmId);
        int flags = PendingIntent.FLAG_IMMUTABLE | modeFlag;
        return PendingIntent.getBroadcast(context, alarmId.hashCode(), intent, flags);
    }

    private static PendingIntent showIntent(Context context, GoalAlarmPayload payload) {
        Intent intent = new Intent(context, GoalAlarmActivity.class);
        intent.setData(Uri.parse("vybaa://goal-alarm/open/" + Uri.encode(payload.id)));
        addPayload(intent, payload);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        return PendingIntent.getActivity(context, payload.id.hashCode(), intent, flags);
    }
}
