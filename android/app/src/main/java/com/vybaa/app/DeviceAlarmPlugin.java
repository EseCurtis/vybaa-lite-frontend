package com.vybaa.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "DeviceAlarm",
    permissions = @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
)
public final class DeviceAlarmPlugin extends Plugin {
    @Override
    public void load() {
        publishPendingAction();
    }

    @Override
    protected void handleOnResume() {
        publishPendingAction();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        GoalAlarmScheduler.cancelAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("state", permissionName());
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("permission", permissionName());
        result.put("scheduledCount", GoalAlarmStore.load(getContext()).size());
        result.put("supported", true);
        call.resolve(result);
    }

    @PluginMethod
    public void reconcile(PluginCall call) {
        if (!"granted".equals(permissionName())) {
            JSObject unavailable = new JSObject();
            unavailable.put("scheduledIds", new JSArray());
            call.resolve(unavailable);
            return;
        }
        JSArray alarmObjects = call.getArray("alarms");
        if (alarmObjects == null) {
            call.reject("A valid alarms array is required");
            return;
        }
        try {
            List<GoalAlarmPayload> alarms = new ArrayList<>();
            for (int index = 0; index < alarmObjects.length(); index += 1) {
                alarms.add(GoalAlarmPayload.fromJson(alarmObjects.getJSONObject(index)));
            }
            JSArray cancelledGoalObjects = call.getArray("cancelSnoozesForGoalIds", new JSArray());
            java.util.Set<String> cancelSnoozesForGoalIds = new java.util.HashSet<>();
            for (int index = 0; index < cancelledGoalObjects.length(); index += 1) {
                cancelSnoozesForGoalIds.add(cancelledGoalObjects.getString(index));
            }
            List<String> scheduledIds = GoalAlarmScheduler.reconcile(
                getContext(),
                alarms,
                cancelSnoozesForGoalIds
            );
            JSObject result = new JSObject();
            result.put("scheduledIds", new JSArray(scheduledIds));
            call.resolve(result);
        } catch (JSONException | java.time.format.DateTimeParseException error) {
            call.reject("Goal alarm payload is invalid", error);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!GoalAlarmScheduler.canScheduleExactAlarms(getContext())) {
            GoalAlarmStore.markExactAlarmPermissionRequested(getContext());
            Intent intent = GoalAlarmScheduler.exactAlarmSettingsIntent(getContext());
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("state", "prompt");
            call.resolve(result);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }
        resolvePermission(call);
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        resolvePermission(call);
    }

    private String permissionName() {
        if (!GoalAlarmScheduler.canScheduleExactAlarms(getContext())) {
            return GoalAlarmStore.hasRequestedExactAlarmPermission(getContext()) ? "denied" : "prompt";
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && getPermissionState("notifications") != PermissionState.GRANTED) {
            PermissionState notificationState = getPermissionState("notifications");
            return notificationState == PermissionState.DENIED ? "denied" : "prompt";
        }
        return "granted";
    }

    private void resolvePermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("state", permissionName());
        call.resolve(result);
    }

    private void publishPendingAction() {
        GoalAlarmStore.PendingAction action = GoalAlarmStore.consumePendingAction(getContext());
        if (action == null) return;
        JSObject event = new JSObject();
        event.put("alarmId", action.alarmId);
        if (action.route != null) event.put("route", action.route);
        event.put("type", action.type);
        notifyListeners("alarmAction", event, true);
    }
}
