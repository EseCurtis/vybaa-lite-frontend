package com.vybaa.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public final class GoalAlarmRingingService extends Service {
    private static final String CHANNEL_ID = "goal_alarms";
    private static final int NOTIFICATION_ID = 7912;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;

    static Intent createIntent(Context context, GoalAlarmPayload payload) {
        Intent intent = new Intent(context, GoalAlarmRingingService.class);
        intent.putExtra(GoalAlarmScheduler.EXTRA_ALARM_ID, payload.id);
        intent.putExtra(GoalAlarmScheduler.EXTRA_BODY, payload.body);
        intent.putExtra(GoalAlarmScheduler.EXTRA_ROUTE, payload.route);
        intent.putExtra(GoalAlarmScheduler.EXTRA_SNOOZE_MINUTES, payload.snoozeMinutes);
        intent.putExtra(GoalAlarmScheduler.EXTRA_TITLE, payload.title);
        return intent;
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, GoalAlarmRingingService.class));
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(NOTIFICATION_ID);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String alarmId = intent.getStringExtra(GoalAlarmScheduler.EXTRA_ALARM_ID);
        String title = intent.getStringExtra(GoalAlarmScheduler.EXTRA_TITLE);
        String body = intent.getStringExtra(GoalAlarmScheduler.EXTRA_BODY);
        String route = intent.getStringExtra(GoalAlarmScheduler.EXTRA_ROUTE);
        int snoozeMinutes = intent.getIntExtra(GoalAlarmScheduler.EXTRA_SNOOZE_MINUTES, 10);
        if (alarmId == null || title == null || body == null || route == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        GoalAlarmPayload payload = new GoalAlarmPayload(
            body,
            System.currentTimeMillis(),
            "",
            alarmId,
            "",
            route,
            false,
            snoozeMinutes,
            title
        );
        startForeground(NOTIFICATION_ID, buildNotification(payload));
        startSoundAndVibration();
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        stopSoundAndVibration();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildNotification(GoalAlarmPayload payload) {
        Intent screenIntent = new Intent(this, GoalAlarmActivity.class);
        screenIntent.setData(Uri.parse("vybaa://goal-alarm/open/" + Uri.encode(payload.id)));
        screenIntent.putExtra(GoalAlarmScheduler.EXTRA_ALARM_ID, payload.id);
        screenIntent.putExtra(GoalAlarmScheduler.EXTRA_BODY, payload.body);
        screenIntent.putExtra(GoalAlarmScheduler.EXTRA_ROUTE, payload.route);
        screenIntent.putExtra(GoalAlarmScheduler.EXTRA_SNOOZE_MINUTES, payload.snoozeMinutes);
        screenIntent.putExtra(GoalAlarmScheduler.EXTRA_TITLE, payload.title);
        int immutableUpdate = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent screen = PendingIntent.getActivity(this, payload.id.hashCode(), screenIntent, immutableUpdate);

        PendingIntent stop = actionIntent(payload, GoalAlarmActionReceiver.ACTION_STOP, 31);
        PendingIntent snooze = actionIntent(payload, GoalAlarmActionReceiver.ACTION_SNOOZE, 47);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(com.vybaa.app.R.mipmap.ic_notif)
            .setContentTitle(payload.title)
            .setContentText(payload.body)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(screen)
            .setFullScreenIntent(screen, true)
            .addAction(0, "Stop", stop)
            .addAction(0, "Snooze 10 min", snooze)
            .build();
    }

    private PendingIntent actionIntent(GoalAlarmPayload payload, String action, int salt) {
        Intent intent = new Intent(this, GoalAlarmActionReceiver.class);
        intent.setAction(action);
        intent.setData(Uri.parse("vybaa://goal-alarm/action/" + Uri.encode(payload.id) + "/" + salt));
        intent.putExtra(GoalAlarmScheduler.EXTRA_ALARM_ID, payload.id);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        return PendingIntent.getBroadcast(this, payload.id.hashCode() + salt, intent, flags);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Goal alarms",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Rings for goal reminder times");
        channel.setBypassDnd(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setSound(null, null);
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.createNotificationChannel(channel);
    }

    private void startSoundAndVibration() {
        stopSoundAndVibration();
        Uri sound = Settings.System.DEFAULT_ALARM_ALERT_URI;
        mediaPlayer = new MediaPlayer();
        try {
            mediaPlayer.setDataSource(this, sound);
            mediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build()
            );
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception ignored) {
            mediaPlayer.release();
            mediaPlayer = null;
        }

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(new long[] { 0, 700, 500 }, 0));
        } else {
            vibrator.vibrate(new long[] { 0, 700, 500 }, 0);
        }
    }

    private void stopSoundAndVibration() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
    }
}
