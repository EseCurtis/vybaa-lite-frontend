import { notificationAPI, type Notification } from '@/shared/api/notification.api'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { useQueryClient } from '@tanstack/react-query'
import { notificationQueryKeys } from '@/shared/api/notification.query-keys'
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
  showLocalNotification: (title: string, body: string, data?: any) => Promise<void>
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
  const isInitializedRef = useRef(false)

  // Initialize local notifications on mobile
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeLocalNotifications()
    }
  }, [])

  const initializeLocalNotifications = async () => {
    try {
      // Request permission
      const permission = await LocalNotifications.requestPermissions()
      
      if (permission.display === 'granted') {
        console.log('Local notifications permission granted')
        
        // Listen for notification actions
        await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Notification action performed:', notification)
          // Handle notification tap - could navigate to specific page based on data
        })
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error)
    }
  }

  const showLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (!Capacitor.isNativePlatform()) {
      // Show toast on web
      toast.info(title + ': ' + body)
      return
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            extra: data,
            schedule: { at: new Date(Date.now() + 1000) }, // Show after 1 second
          },
        ],
      })
    } catch (error) {
      console.error('Error showing local notification:', error)
    }
  }, [toast])

  // Connect to Ably when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || isInitializedRef.current) {
      return
    }

    const connectToAbly = async () => {
      try {
        // Dynamically import Ably (only on client side)
        const Ably = (await import('ably')).default
        
        // Get auth token from backend
        const authResponse = await notificationAPI.getAblyAuth()
        
        // Create Ably client with token
        const ablyClient = new Ably.Realtime({
          authCallback: async (tokenParams, callback) => {
            try {
              const response = await notificationAPI.getAblyAuth()
              callback(null, response.data)
            } catch (error: any) {
              callback(error, null)
            }
          },
        })

        ablyRef.current = ablyClient

        // Subscribe to user's channel
        const channel = ablyClient.channels.get(`user:${user.id}`)
        channelRef.current = channel

        // Listen for connection state changes
        ablyClient.connection.on('connected', () => {
          console.log('Connected to Ably')
          setIsConnected(true)
        })

        ablyClient.connection.on('disconnected', () => {
          console.log('Disconnected from Ably')
          setIsConnected(false)
        })

        // Listen for notifications
        channel.subscribe('notification', (message: any) => {
          const notification = message.data as Notification
          console.log('Received notification:', notification)
          
          // Add to local state
          setNotifications((prev) => [notification, ...prev])
          setUnreadCount((prev) => prev + 1)
          
          // Show toast
          toast.info(notification.title, {
            description: notification.message,
          })
          
          // Show local notification on mobile
          showLocalNotification(notification.title, notification.message, notification.data)
          
          // Invalidate queries to refresh notification list
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() })
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() })
        })

        isInitializedRef.current = true
      } catch (error) {
        console.error('Error connecting to Ably:', error)
      }
    }

    connectToAbly()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      if (ablyRef.current) {
        ablyRef.current.close()
      }
      isInitializedRef.current = false
    }
  }, [isAuthenticated, user, toast, showLocalNotification, queryClient])

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
    showLocalNotification,
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
