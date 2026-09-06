import { describe, expect, it } from 'vitest'

import {
  claimInAppNotificationDisplay,
  formatInAppNotification,
  getInAppNotification,
  getPushNotificationRoute,
  shouldDisplayInAppNotification,
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
      sender: null,
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
      sender: null,
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

  it('maps the legacy app-prefixed notifications route to the notifications screen', () => {
    expect(
      getPushNotificationRoute({ data: { route: '/app/notifications' } }),
    ).toBe('/notifications')
  })

  it('normalizes trusted full links and alternate FCM route fields', () => {
    expect(
      getPushNotificationRoute({
        data: {
          data: JSON.stringify({
            click_action: 'https://vybaa.app/app/r/rewind_456',
          }),
        },
      }),
    ).toBe('/app/r/rewind_456')

    expect(
      getPushNotificationRoute({
        data: { link: 'vybaa://invite/ab12cd' },
      }),
    ).toBe('/app/invite/AB12CD')
  })

  it('rejects protocol-relative routes from notification data', () => {
    expect(
      getPushNotificationRoute({
        data: { route: '//untrusted.example/app/rewind' },
      }),
    ).toBeNull()
  })

  it('deduplicates Rewind message events and native pushes by message id', () => {
    expect(
      getInAppNotification({
        body: 'u around?',
        data: {
          data: {
            chatId: 'chat-1',
            messageId: 'message-1',
            route: '/app/rewind-chat/chat-1',
          },
          id: 'notification-1',
          message: 'u around?',
          title: 'Lyra sent you a message',
          type: 'rewind_chat_message',
        },
        title: 'Lyra sent you a message',
      })?.id,
    ).toBe('rewind-chat-message:message-1')
  })

  it('uses a validated local partner avatar for personalized notifications', () => {
    expect(
      getInAppNotification({
        body: 'btw, your reflection is ready',
        data: {
          data: JSON.stringify({
            notificationSender: {
              avatarUrl: 'https://vybaa.app/assets/rewind/lyra.png',
              name: 'Lyra',
              personaId: 'lyra',
            },
            route: '/app/rewind',
          }),
          id: 'notification-personalized',
          type: 'system',
        },
        title: 'Your reflection is ready',
      }),
    ).toEqual({
      id: 'notification-personalized',
      message: 'btw, your reflection is ready',
      route: '/app/rewind',
      sender: null,
      title: 'Your reflection is ready',
    })
  })

  it('shows the actual sender avatar without repeating their name in chat copy', () => {
    const notification = getInAppNotification({
      body: 'u around? 👀',
      data: {
        data: JSON.stringify({
          chatId: 'chat-1',
          notificationSender: {
            avatarUrl: 'https://example.invalid/ignored.png',
            name: 'Ella',
            personaId: 'ella',
          },
          route: '/app/rewind-chat/chat-1',
        }),
        id: 'notification-message',
        type: 'rewind_chat_message',
      },
      title: 'Ella',
    })

    expect(notification?.sender).toEqual({
      avatarUrl: '/assets/rewind/ella.png',
      name: 'Ella',
      personaId: 'ella',
    })
    expect(formatInAppNotification(notification!)).toBe('u around? 👀')
  })

  it('uses Neeja and Tobi local avatars for their message notifications', () => {
    for (const personaId of ['neeja', 'tobi'] as const) {
      const notification = getInAppNotification({
        body: 'u around?',
        data: {
          chatId: 'chat-new-partner',
          notificationSender: {
            avatarUrl: 'https://example.invalid/ignored.png',
            name: personaId === 'neeja' ? 'Neeja' : 'Tobi',
            personaId,
          },
          type: 'rewind_chat_message',
        },
        title: 'New message',
      })
      expect(notification?.sender?.avatarUrl).toBe(
        `/assets/rewind/${personaId}.png`,
      )
    }
  })

  it('suppresses foreground banners on their active route and while hidden', () => {
    expect(
      shouldDisplayInAppNotification(
        '/app/rewind-chat/chat-1',
        '/app/rewind-chat/chat-1/',
        'visible',
      ),
    ).toBe(false)
    expect(
      shouldDisplayInAppNotification(
        '/app/rewind-chat/chat-1',
        '/app/rewind-chats',
        'visible',
      ),
    ).toBe(true)
    expect(
      shouldDisplayInAppNotification(
        '/app/rewind-chat/chat-1',
        '/app/rewind-chats',
        'hidden',
      ),
    ).toBe(false)
  })
})
