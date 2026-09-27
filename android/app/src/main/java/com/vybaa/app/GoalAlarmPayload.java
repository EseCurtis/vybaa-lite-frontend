package com.vybaa.app;

import org.json.JSONException;
import org.json.JSONObject;

final class GoalAlarmPayload {
    final String body;
    final long fireAtMillis;
    final String goalId;
    final String id;
    final String occurrenceId;
    final String route;
    final boolean snoozed;
    final int snoozeMinutes;
    final String title;

    GoalAlarmPayload(
        String body,
        long fireAtMillis,
        String goalId,
        String id,
        String occurrenceId,
        String route,
        boolean snoozed,
        int snoozeMinutes,
        String title
    ) {
        this.body = body;
        this.fireAtMillis = fireAtMillis;
        this.goalId = goalId;
        this.id = id;
        this.occurrenceId = occurrenceId;
        this.route = route;
        this.snoozed = snoozed;
        this.snoozeMinutes = snoozeMinutes;
        this.title = title;
    }

    static GoalAlarmPayload fromJson(JSONObject object) throws JSONException {
        return new GoalAlarmPayload(
            object.getString("body"),
            java.time.Instant.parse(object.getString("fireAt")).toEpochMilli(),
            object.getString("goalId"),
            object.getString("id"),
            object.getString("occurrenceId"),
            object.getString("route"),
            false,
            object.optInt("snoozeMinutes", 10),
            object.getString("title")
        );
    }

    static GoalAlarmPayload fromStoredJson(JSONObject object) throws JSONException {
        return new GoalAlarmPayload(
            object.getString("body"),
            object.getLong("fireAtMillis"),
            object.getString("goalId"),
            object.getString("id"),
            object.getString("occurrenceId"),
            object.getString("route"),
            object.optBoolean("snoozed", false),
            object.optInt("snoozeMinutes", 10),
            object.getString("title")
        );
    }

    GoalAlarmPayload withFireAt(long nextFireAtMillis) {
        return new GoalAlarmPayload(
            body,
            nextFireAtMillis,
            goalId,
            id,
            occurrenceId,
            route,
            true,
            snoozeMinutes,
            title
        );
    }

    JSONObject toJson() throws JSONException {
        JSONObject object = new JSONObject();
        object.put("body", body);
        object.put("fireAtMillis", fireAtMillis);
        object.put("goalId", goalId);
        object.put("id", id);
        object.put("occurrenceId", occurrenceId);
        object.put("route", route);
        object.put("snoozed", snoozed);
        object.put("snoozeMinutes", snoozeMinutes);
        object.put("title", title);
        return object;
    }

    boolean hasSameSchedule(GoalAlarmPayload other) {
        return body.equals(other.body)
            && fireAtMillis == other.fireAtMillis
            && goalId.equals(other.goalId)
            && occurrenceId.equals(other.occurrenceId)
            && route.equals(other.route)
            && snoozed == other.snoozed
            && snoozeMinutes == other.snoozeMinutes
            && title.equals(other.title);
    }
}
