package com.vybaa.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

final class GoalAlarmStore {
    private static final String ALARMS_KEY = "alarms";
    private static final String PENDING_ACTION_ALARM_ID_KEY = "pending_action_alarm_id";
    private static final String PENDING_ACTION_ROUTE_KEY = "pending_action_route";
    private static final String PENDING_ACTION_TYPE_KEY = "pending_action_type";
    private static final String PREFERENCES_NAME = "vybaa_goal_alarms";
    private static final String REQUESTED_PERMISSION_KEY = "requested_exact_alarm_permission";

    private GoalAlarmStore() {}

    static void clear(Context context) {
        preferences(context).edit().remove(ALARMS_KEY).apply();
    }

    static GoalAlarmPayload find(Context context, String alarmId) {
        for (GoalAlarmPayload payload : load(context)) {
            if (payload.id.equals(alarmId)) return payload;
        }
        return null;
    }

    static boolean hasRequestedExactAlarmPermission(Context context) {
        return preferences(context).getBoolean(REQUESTED_PERMISSION_KEY, false);
    }

    static List<GoalAlarmPayload> load(Context context) {
        String stored = preferences(context).getString(ALARMS_KEY, "[]");
        List<GoalAlarmPayload> payloads = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(stored);
            for (int index = 0; index < array.length(); index += 1) {
                payloads.add(GoalAlarmPayload.fromStoredJson(array.getJSONObject(index)));
            }
        } catch (JSONException ignored) {
            return new ArrayList<>();
        }
        return payloads;
    }

    static void markExactAlarmPermissionRequested(Context context) {
        preferences(context).edit().putBoolean(REQUESTED_PERMISSION_KEY, true).apply();
    }

    static PendingAction consumePendingAction(Context context) {
        SharedPreferences store = preferences(context);
        String alarmId = store.getString(PENDING_ACTION_ALARM_ID_KEY, null);
        String type = store.getString(PENDING_ACTION_TYPE_KEY, null);
        String route = store.getString(PENDING_ACTION_ROUTE_KEY, null);
        if (alarmId == null || type == null) return null;
        store.edit()
            .remove(PENDING_ACTION_ALARM_ID_KEY)
            .remove(PENDING_ACTION_ROUTE_KEY)
            .remove(PENDING_ACTION_TYPE_KEY)
            .apply();
        return new PendingAction(alarmId, route, type);
    }

    static void recordAction(Context context, GoalAlarmPayload payload, String type) {
        preferences(context).edit()
            .putString(PENDING_ACTION_ALARM_ID_KEY, payload.id)
            .putString(PENDING_ACTION_ROUTE_KEY, payload.route)
            .putString(PENDING_ACTION_TYPE_KEY, type)
            .apply();
    }

    static void remove(Context context, String alarmId) {
        List<GoalAlarmPayload> remaining = new ArrayList<>();
        for (GoalAlarmPayload payload : load(context)) {
            if (!payload.id.equals(alarmId)) remaining.add(payload);
        }
        save(context, remaining);
    }

    static void save(Context context, List<GoalAlarmPayload> payloads) {
        JSONArray array = new JSONArray();
        for (GoalAlarmPayload payload : payloads) {
            try {
                array.put(payload.toJson());
            } catch (JSONException ignored) {
                // A malformed payload is omitted rather than corrupting the manifest.
            }
        }
        preferences(context).edit().putString(ALARMS_KEY, array.toString()).apply();
    }

    static void upsert(Context context, GoalAlarmPayload updated) {
        List<GoalAlarmPayload> payloads = load(context);
        List<GoalAlarmPayload> next = new ArrayList<>();
        boolean replaced = false;
        for (GoalAlarmPayload payload : payloads) {
            if (payload.id.equals(updated.id)) {
                next.add(updated);
                replaced = true;
            } else {
                next.add(payload);
            }
        }
        if (!replaced) next.add(updated);
        save(context, next);
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    static final class PendingAction {
        final String alarmId;
        final String route;
        final String type;

        PendingAction(String alarmId, String route, String type) {
            this.alarmId = alarmId;
            this.route = route;
            this.type = type;
        }
    }
}
