import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import type { Notification } from '@/shared/api/notification.api'
import { notificationQueryKeys } from '@/shared/api/notification.query-keys'
import type {
  RewindChat,
  RewindChatRealtimeEvent,
} from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import {
  claimInAppNotificationDisplay,
  formatInAppNotification,
  getInAppNotification,
  getRewindChatNotificationDisplayId,
  shouldDisplayInAppNotification,
} from '@/shared/notifications/in-app-notification.util'
import {
  RealtimeSocketClient,
  type NotificationRealtimeSignal,
} from '@/shared/realtime/realtime-socket.client'
import {
  getRealtimeTypingParticipants,
  updateRealtimeTypingTurns,
  updateRewindChatsFromRealtime,
  updateRewindMessagesFromRealtime,
  type RealtimeTypingTurn,
  type RewindChatMessagesCache,
} from '@/shared/rewind/rewind-chat-realtime.util'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

interface NotificationContextValue {
  addNotification: (notification: Notification) => void
  isConnected: boolean
  notifications: Notification[]
  subscribeRewindChat: (
    listener: (event: RewindChatRealtimeEvent) => void,
  ) => () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const NOTIFICATION_POLL_INTERVAL_MS = 60_000

function getRewindChatRoute(chatId: string): string {
  return `/app/rewind-chat/${encodeURIComponent(chatId)}`
}

function openAppRoute(route: string): void {
  window.location.assign(route)
}

export function NotificationProvider({
  children,
}: {
  children: ReactNode
}): ReactNode {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const rewindListenersRef = useRef<
    Set<(event: RewindChatRealtimeEvent) => void>
  >(new Set())
  const realtimeTypingTurnsRef = useRef<
    ReadonlyMap<string, RealtimeTypingTurn>
  >(new Map())
  const notifiedRewindRunIdsRef = useRef<Set<string>>(new Set())

  const refreshNotificationData = useCallback((): void => {
    void queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.lists(),
    })
    void queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.unreadCount(),
    })
  }, [queryClient])

  const handleRealtimeNotification = useCallback(
    (signal: NotificationRealtimeSignal): void => {
      const notification = getInAppNotification({
        body: signal.latestNotification.message,
        data: signal.latestNotification,
        id: signal.latestNotification.id,
        title: signal.latestNotification.title,
      })
      const isBatch = signal.notificationCount > 1
      const route = isBatch ? '/notifications' : (notification?.route ?? null)
      const displayId = isBatch
        ? `notification-batch:${signal.latestNotification.id}:${signal.notificationCount}`
        : notification?.id
      const shouldDisplay = shouldDisplayInAppNotification(
        route,
        window.location.pathname,
        document.visibilityState,
      )

      if (notification && displayId && shouldDisplay) {
        if (claimInAppNotificationDisplay(displayId)) {
          let message = formatInAppNotification(notification)
          if (isBatch) {
            message = `you have ${signal.notificationCount} new notifications.`
          }
          toast.notification(message, {
            avatarAlt:
              !isBatch && notification.sender
                ? `${notification.sender.name} avatar`
                : undefined,
            avatarUrl: isBatch ? undefined : notification.sender?.avatarUrl,
            onOpen: route ? () => openAppRoute(route) : undefined,
          })
        }
      }
      refreshNotificationData()
    },
    [refreshNotificationData, toast],
  )

  const handleRewindEvent = useCallback(
    (event: RewindChatRealtimeEvent): void => {
      realtimeTypingTurnsRef.current = updateRealtimeTypingTurns(
        realtimeTypingTurnsRef.current,
        event,
      )
      const activeParticipants = getRealtimeTypingParticipants(
        realtimeTypingTurnsRef.current,
        event.chatId,
      )
      const chatRoute = getRewindChatRoute(event.chatId)
      const isChatVisible =
        document.visibilityState === 'visible' &&
        !shouldDisplayInAppNotification(
          chatRoute,
          window.location.pathname,
          document.visibilityState,
        )

      queryClient.setQueryData<RewindChat[]>(
        rewindQueryKeys.chats(),
        (current) =>
          updateRewindChatsFromRealtime(
            current,
            event,
            activeParticipants,
            isChatVisible,
          ),
      )
      queryClient.setQueryData<RewindChatMessagesCache>(
        rewindQueryKeys.chatMessages(event.chatId),
        (current) => updateRewindMessagesFromRealtime(current, event),
      )

      if (
        event.type === 'message_committed' &&
        event.message.personaId &&
        !notifiedRewindRunIdsRef.current.has(event.runId)
      ) {
        if (notifiedRewindRunIdsRef.current.size >= 250) {
          notifiedRewindRunIdsRef.current = new Set()
        }
        notifiedRewindRunIdsRef.current.add(event.runId)
        const displayId = getRewindChatNotificationDisplayId(event.messageId)
        const shouldNotify = shouldDisplayInAppNotification(
          chatRoute,
          window.location.pathname,
          document.visibilityState,
        )
        if (shouldNotify && claimInAppNotificationDisplay(displayId)) {
          const sourcePersona = getRewindPersona(event.message.personaId)
          toast.notification(event.message.content, {
            avatarAlt: `${sourcePersona.name} avatar`,
            avatarUrl: sourcePersona.avatar,
            onOpen: () => openAppRoute(chatRoute),
          })
        }
      }

      if (
        event.type === 'chat_invalidated' ||
        event.type === 'message_committed'
      ) {
        void queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.homeGreeting(),
        })
      }

      if (
        event.type === 'chat_invalidated' ||
        event.type === 'user_message_committed' ||
        event.type === 'run_failed' ||
        (event.type === 'run_state' &&
          ['CANCELLED', 'COMPLETED', 'FAILED'].includes(event.status))
      ) {
        void queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.chats(),
        })
      }

      for (const listener of rewindListenersRef.current) listener(event)
    },
    [queryClient, toast],
  )

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setIsConnected(false)
      notifiedRewindRunIdsRef.current = new Set()
      realtimeTypingTurnsRef.current = new Map()
      return
    }
    const client = new RealtimeSocketClient({
      onConnected: () => {
        setIsConnected(true)
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: rewindQueryKeys.chats(),
          }),
          queryClient.invalidateQueries({
            queryKey: rewindQueryKeys.homeGreeting(),
          }),
        ])
      },
      onDisconnected: () => setIsConnected(false),
      onNotification: handleRealtimeNotification,
      onRewindEvent: handleRewindEvent,
    })
    client.start()
    const notificationPoll = window.setInterval(
      refreshNotificationData,
      NOTIFICATION_POLL_INTERVAL_MS,
    )
    return () => {
      window.clearInterval(notificationPoll)
      client.stop()
      notifiedRewindRunIdsRef.current = new Set()
      realtimeTypingTurnsRef.current = new Map()
    }
  }, [
    handleRealtimeNotification,
    handleRewindEvent,
    isAuthenticated,
    refreshNotificationData,
    user?.id,
  ])

  const addNotification = useCallback((notification: Notification): void => {
    setNotifications((current) => [notification, ...current])
    if (!notification.isRead) setUnreadCount((current) => current + 1)
  }, [])

  const subscribeRewindChat = useCallback(
    (listener: (event: RewindChatRealtimeEvent) => void): (() => void) => {
      rewindListenersRef.current.add(listener)
      return () => rewindListenersRef.current.delete(listener)
    },
    [],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      addNotification,
      isConnected,
      notifications,
      subscribeRewindChat,
      unreadCount,
    }),
    [
      addNotification,
      isConnected,
      notifications,
      subscribeRewindChat,
      unreadCount,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider',
    )
  }
  return context
}
