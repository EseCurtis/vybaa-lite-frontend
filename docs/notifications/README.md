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





