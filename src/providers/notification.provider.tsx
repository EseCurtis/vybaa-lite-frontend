import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { notificationAPI, type Notification } from '@/shared/api/notification.api'
import { notificationQueryKeys } from '@/shared/api/notification.query-keys'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  addNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  
  const ablyRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const connectionListenersRef = useRef<{ connected?: any; disconnected?: any; failed?: any }>({})

  // Note: FCM push notifications are handled by Capacitor plugin
  // See: app/src/plugins/capacitor/plugins/push-notification.plugin.ts
  // The plugin automatically registers FCM tokens and syncs to backend

  // Connect to Ably when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    let isMounted = true

    const connectToAbly = async () => {
      try {
        console.log('Initializing Ably connection for user:', user.id)
        
        // Dynamically import Ably (only on client side)
        const Ably = (await import('ably')).default
        
        // Create Ably client with token auth
        const ablyClient = new Ably.Realtime({
          authCallback: async (tokenParams, callback) => {
            try {
              const response = await notificationAPI.getAblyAuth()
              callback(null, response.data)
            } catch (error: any) {
              console.error('Ably auth error:', error)
              callback(error, null)
            }
          },
        })

        if (!isMounted) {
          ablyClient.close()
          return
        }

        ablyRef.current = ablyClient

        // Subscribe to user's channel
        const channel = ablyClient.channels.get(`user:${user.id}`)
        channelRef.current = channel

        // Connection event handlers
        const onConnected = () => {
          console.log('✅ Connected to Ably')
          if (isMounted) {
            setIsConnected(true)
          }
        }

        const onDisconnected = () => {
          console.log('❌ Disconnected from Ably')
          if (isMounted) {
            setIsConnected(false)
          }
        }

        const onFailed = (stateChange: any) => {
          console.error('⚠️ Ably connection failed:', stateChange.reason)
          if (isMounted) {
            setIsConnected(false)
          }
        }

        // Store references for cleanup
        connectionListenersRef.current = {
          connected: onConnected,
          disconnected: onDisconnected,
          failed: onFailed,
        }

        // Listen for connection state changes
        ablyClient.connection.on('connected', onConnected)
        ablyClient.connection.on('disconnected', onDisconnected)
        ablyClient.connection.on('failed', onFailed)

        // Listen for notifications
        channel.subscribe('notification', (message: any) => {
          if (!isMounted) return

          const notification = message.data as Notification
          console.log('📬 Received notification:', notification)
          
          // Add to local state (only if unread)
          if (!notification.isRead) {
            setNotifications((prev) => [notification, ...prev])
            setUnreadCount((prev) => prev + 1)
          }
          
          // Show toast
          toast.info(notification.title)
          toast.info(notification.message)
          
          // Invalidate queries to refresh notification list
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() })
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() })
        })

        console.log('🔔 Subscribed to notifications channel')
      } catch (error) {
        console.error('❌ Error connecting to Ably:', error)
        if (isMounted) {
          setIsConnected(false)
        }
      }
    }

    connectToAbly()

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Ably connection')
      isMounted = false

      // Unsubscribe from channel
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe('notification')
          channelRef.current.detach()
        } catch (error) {
          console.error('Error unsubscribing from channel:', error)
        }
      }

      // Remove connection event listeners
      if (ablyRef.current && connectionListenersRef.current) {
        const conn = ablyRef.current.connection
        if (connectionListenersRef.current.connected) {
          conn.off('connected', connectionListenersRef.current.connected)
        }
        if (connectionListenersRef.current.disconnected) {
          conn.off('disconnected', connectionListenersRef.current.disconnected)
        }
        if (connectionListenersRef.current.failed) {
          conn.off('failed', connectionListenersRef.current.failed)
        }
      }

      // Close Ably connection
      if (ablyRef.current) {
        try {
          ablyRef.current.close()
        } catch (error) {
          console.error('Error closing Ably connection:', error)
        }
      }

      // Reset refs
      ablyRef.current = null
      channelRef.current = null
      connectionListenersRef.current = {}
      setIsConnected(false)
    }
  }, [isAuthenticated, user?.id, toast, queryClient])

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev])
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1)
    }
  }, [])

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
