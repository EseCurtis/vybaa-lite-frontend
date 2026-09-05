# Notifications & Timezone Scheduler (Client)

## Fetch Notifications

Use the shared API client:

```
import { notificationAPI } from '@/shared/api/notification.api'

// List notifications
const res = await notificationAPI.list(1, 10)

// Mark seen
await notificationAPI.markSeen(123)
```

## Timezone Registration

When the app detects a user timezone (e.g., from device settings), call the server endpoint once per unique timezone to bootstrap scheduling:

```
import { http } from '@/shared/api/http'

await http.post('/api/v1/cron/timezone', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
```

This ensures that the server maintains recurring jobs for that timezone.

## Rewind communication notifications on iOS

Rewind chat pushes use the `RewindNotificationService` target. The backend
flattens `senderId`, `senderName`, `avatarUrl`, and `conversationId` into the FCM
data payload. The extension downloads only the allowlisted Vybaa Cloudinary
avatar, donates an incoming `INSendMessageIntent`, and updates the notification
content before delivery.

Before shipping:

1. In Apple Developer Certificates, Identifiers & Profiles, enable Push
   Notifications and Communication Notifications for the parent app ID
   `com.vybaa.app`. Communication Notifications is an app capability; it is not
   added to the notification-service extension entitlement.
2. Open `ios/App/App.xcworkspace`, select the `Vybaa` and
   `RewindNotificationService` targets, and confirm both use the Vybaa team with
   automatic signing enabled. The extension bundle ID is
   `com.vybaa.app.RewindNotificationService`.
3. Keep the APNs authentication key connected to the Vybaa Firebase iOS app.
4. Test a real `rewind_chat_message` push on a physical iPhone while the app is
   backgrounded or closed. The simulator and foreground toast do not prove that
   iOS rendered the communication-notification avatar.

Remote small icons are not supported on Android. Android uses the app's bundled
small icon and the partner's Cloudinary portrait as the notification image.
