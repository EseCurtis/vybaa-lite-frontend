import { describe, expect, it } from 'vitest'

import {
  claimInAppNotificationDisplay,
  formatInAppNotification,
  getInAppNotification,
  getPushNotificationRoute,
} from './in-app-notification.util'

describe('in-app notification payloads', () => {
  it('reads routes from the legacy nested FCM data payload', () => {
    expect(
      getInAppNotification({
        data: {
          data: JSON.stringify({ route: '/app/r/rewind_123' }),
          id: 'notification_123',
          message: 'Your reflection is ready whenever you are.',
          title: 'Your Rewind summary is ready',
        },
      }),
    ).toEqual({
      id: 'notification_123',
      message: 'Your reflection is ready whenever you are.',
      route: '/app/r/rewind_123',
      title: 'Your Rewind summary is ready',
    })
  })

  it('prefers the native title and body while retaining the route', () => {
    const notification = getInAppNotification({
      body: 'Native message',
      data: { id: 'notification_456', route: '/app/rewind' },
      title: 'Native title',
    })

    expect(notification).toEqual({
      id: 'notification_456',
      message: 'Native message',
      route: '/app/rewind',
      title: 'Native title',
    })
    expect(formatInAppNotification(notification!)).toBe(
      'Native title: Native message',
    )
  })

  it('deduplicates the same foreground notification across transports', () => {
    expect(claimInAppNotificationDisplay('notification_dedupe', 1_000)).toBe(
      true,
    )
    expect(claimInAppNotificationDisplay('notification_dedupe', 5_000)).toBe(
      false,
    )
    expect(claimInAppNotificationDisplay('notification_dedupe', 12_000)).toBe(
      true,
    )
  })

  it('keeps the route actionable when a native payload has no visible content', () => {
    expect(
      getPushNotificationRoute({
        data: { route: '/app/rewind' },
      }),
    ).toBe('/app/rewind')
  })

  it('rejects protocol-relative routes from notification data', () => {
    expect(
      getPushNotificationRoute({
        data: { route: '//untrusted.example/app/rewind' },
      }),
    ).toBeNull()
  })
})
