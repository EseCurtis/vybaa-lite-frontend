import { userAPI } from '@/shared/api/user.api';
import { PushNotifications } from '@capacitor/push-notifications';
import { createPushNotificationChannel } from '../helpers/push-notifications.helper';

export const addPushNotificationListeners = async () => {
    return Promise.all([await PushNotifications.addListener('registration', async (token) => {
        // console.info('Registration token: ', token.value);

        // Store token in localStorage for hydration sync
        if (typeof window !== 'undefined') {
            localStorage.setItem('fcmToken', token.value);
        }

        // Sync FCM token to backend
        try {
            await userAPI.syncFCMToken(token.value);
            console.info('FCM token synced successfully');
        } catch (error) {
            console.error('Failed to sync FCM token:', error);
        }
    }),

    await PushNotifications.addListener('registrationError', err => {
        console.error('Registration error: ', err.error);
        // alert( "Error=>>"+JSON.stringify(err))
    }),

    await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received: ', notification);
    }),

    await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
    })])
}

export const registerPushNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

   

    if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
    }
     //alert(permStatus.receive)

    return await PushNotifications.register();
}

export const getDeliveredPushNotifications = async () => {
    const notificationList = await PushNotifications.getDeliveredNotifications();
    console.log('delivered notifications', notificationList);
}

export const createPushNotificationChannels = async () => {
    const STREEK_REMINDER_CHANNEL_PAYLOAD = createPushNotificationChannel({
        importance: 4,
        visibility: 1,
        lights: true,
        vibration: true,
        lightColor: "green",
        id: "streek_notif_1",
        name: "STREEK_REMINDER",
        description: "Reminder for your streeks",
        sound: "streek_reminder_sound.wav",
    });


    await PushNotifications.createChannel(STREEK_REMINDER_CHANNEL_PAYLOAD).then(console.log).catch(console.error);
}