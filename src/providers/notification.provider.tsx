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
import type { RewindChatRealtimeEvent } from '@/shared/api/rewind.api'
import {
  claimInAppNotificationDisplay,
  formatInAppNotification,
} from '@/shared/notifications/in-app-notification.util'
import { RealtimeSocketClient } from '@/shared/realtime/realtime-socket.client'

interface NotificationContextValue {
  addNotification: (notification: Notification) => void
  isConnected: boolean
  notifications: Notification[]
  subscribeRewindChat: (
    listener: (event: RewindChatRealtimeEvent) => void,
  ) => () => void
  unreadCount: number
}

interface NotificationPreview {
  createdAt: string
  id: string
  message: string
  title: string
  type: string
}

interface NotificationRealtimeSignal {
  latestNotification: NotificationPreview
  notificationCount: number
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const NOTIFICATION_POLL_INTERVAL_MS = 60_000

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
      if (
        signal.latestNotification.type !== 'rewind_chat_message' &&
        claimInAppNotificationDisplay(signal.latestNotification.id)
      ) {
        toast.info(
          signal.notificationCount === 1
            ? formatInAppNotification(signal.latestNotification)
            : `${signal.notificationCount} new notifications are ready.`,
        )
      }
      refreshNotificationData()
    },
    [refreshNotificationData, toast],
  )

  const handleRewindEvent = useCallback(
    (event: RewindChatRealtimeEvent): void => {
      for (const listener of rewindListenersRef.current) listener(event)
    },
    [],
  )

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setIsConnected(false)
      return
    }
    const client = new RealtimeSocketClient({
      onConnected: () => setIsConnected(true),
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
