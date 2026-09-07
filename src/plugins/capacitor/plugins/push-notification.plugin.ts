import type { PushNotificationSchema } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import type { QueryClient } from '@tanstack/react-query'

import { notificationQueryKeys } from '@/shared/api/notification.query-keys'
import {
  getInAppNotification,
  getPushNotificationRoute,
  type InAppNotification,
} from '@/shared/notifications/in-app-notification.util'
import { userAPI } from '@/shared/api/user.api'

import { createPushNotificationChannel } from '../helpers/push-notifications.helper'

type ForegroundPushNotificationHandler = (
  notification: InAppNotification,
) => void

let notificationListenersPromise: Promise<void> | null = null
let pushRegistrationPromise: Promise<void> | null = null
let pushChannelPromise: Promise<void> | null = null
let queryClientRef: QueryClient | null = null
let foregroundPushNotificationHandler: ForegroundPushNotificationHandler | null =
  null
let notificationRouteHandler: ((route: string) => void) | null = null
let pendingNotificationRoute: string | null = null

function invalidateNotificationQueries(): void {
  if (!queryClientRef) return

  void queryClientRef.invalidateQueries({
    queryKey: notificationQueryKeys.lists(),
  })
  void queryClientRef.invalidateQueries({
    queryKey: notificationQueryKeys.unreadCount(),
  })
}

function handleForegroundPush(notification: PushNotificationSchema): void {
  invalidateNotificationQueries()

  const inAppNotification = getInAppNotification(notification)
  if (inAppNotification) {
    foregroundPushNotificationHandler?.(inAppNotification)
  }
}

function handlePushAction(notification: PushNotificationSchema): void {
  invalidateNotificationQueries()

  const route = getPushNotificationRoute(notification)
  if (!route) return

  if (notificationRouteHandler) {
    notificationRouteHandler(route)
    return
  }

  pendingNotificationRoute = route
}

async function registerPushNotificationListeners(): Promise<void> {
  await Promise.all([
    PushNotifications.addListener('registration', async (token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fcmToken', token.value)
      }

      await userAPI.syncFCMToken(token.value)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fcm-token-updated'))
      }
    }),
    PushNotifications.addListener('registrationError', () => {
      // Permission and registration state are handled by the caller.
    }),
    PushNotifications.addListener(
      'pushNotificationReceived',
      handleForegroundPush,
    ),
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      ({ notification }) => {
        handlePushAction(notification)
      },
    ),
  ])
}

async function requestPushRegistration(): Promise<void> {
  let permission = await PushNotifications.checkPermissions()
  if (permission.receive === 'prompt') {
    permission = await PushNotifications.requestPermissions()
  }

  if (permission.receive !== 'granted') {
    throw new Error('Push notification permission was not granted.')
  }

  await PushNotifications.register()
}

async function createNotificationChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    return
  }

  const channel = createPushNotificationChannel({
    description: 'Vybaa reminders and updates',
    id: 'vybaa_notifications',
    importance: 4,
    lightColor: 'green',
    lights: true,
    name: 'Vybaa notifications',
    sound: 'streek_reminder_sound.wav',
    vibration: true,
    visibility: 1,
  })

  await PushNotifications.createChannel(channel)
}

export function setQueryClientForNotifications(
  queryClient: QueryClient | null,
): void {
  queryClientRef = queryClient
}

export function setForegroundPushNotificationHandler(
  handler: ForegroundPushNotificationHandler | null,
): void {
  foregroundPushNotificationHandler = handler
}

export function setPushNotificationRouteHandler(
  handler: ((route: string) => void) | null,
): void {
  notificationRouteHandler = handler

  if (!handler || !pendingNotificationRoute) return

  const route = pendingNotificationRoute
  pendingNotificationRoute = null
  handler(route)
}

export function addPushNotificationListeners(): Promise<void> {
  if (!notificationListenersPromise) {
    notificationListenersPromise = registerPushNotificationListeners().catch(
      (error: unknown) => {
        notificationListenersPromise = null
        throw error
      },
    )
  }

  return notificationListenersPromise
}

export function registerPushNotifications(): Promise<void> {
  if (!pushRegistrationPromise) {
    pushRegistrationPromise = requestPushRegistration().catch(
      (error: unknown) => {
        pushRegistrationPromise = null
        throw error
      },
    )
  }

  return pushRegistrationPromise
}

export function getDeliveredPushNotifications() {
  return PushNotifications.getDeliveredNotifications()
}

export function createPushNotificationChannels(): Promise<void> {
  if (!pushChannelPromise) {
    pushChannelPromise = createNotificationChannel().catch((error: unknown) => {
      pushChannelPromise = null
      throw error
    })
  }

  return pushChannelPromise
}
