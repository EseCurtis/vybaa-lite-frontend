import { useSafeAreaInsets } from '@/hooks/use-safe-area-insets.hook'
import { hapticFeedback } from '@/shared/haptic.util'
import React, { useEffect } from 'react'
import type { ExternalToast } from 'sonner'
import { toast as sonnerToast, Toaster } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export type NotificationToastOptions = {
  avatarAlt?: string
  avatarUrl?: string
  duration?: number
  onOpen?: () => void
}

type ToastContextType = {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
  ) => string | number
  success: (message: string, duration?: number) => string | number
  error: (message: string, duration?: number) => string | number
  warning: (message: string, duration?: number) => string | number
  info: (message: string, duration?: number) => string | number
  notification: (
    message: string,
    options?: NotificationToastOptions,
  ) => string | number
  loading: (message: string) => string | number
  dismiss: (id: string | number) => void
}

// Create a simple context for compatibility
const ToastContext = React.createContext<ToastContextType | null>(null)

export const useToast = () => {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { top } = useSafeAreaInsets()

  const showToast = React.useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      const options: ExternalToast = {
        duration: type === 'loading' ? Infinity : duration,
        style: {
          borderRadius: '9999px', // rounded-full
          padding: '12px 16px',
          minWidth: '200px',
          maxWidth: '100vw',
        },
      }

      switch (type) {
        case 'success':
          return sonnerToast.success(message, options)
        case 'error':
          return sonnerToast.error(message, options)
        case 'warning':
          return sonnerToast.warning(message, options)
        case 'loading':
          return sonnerToast.loading(message, options)
        default:
          return sonnerToast.info(message, options)
      }
    },
    [],
  )

  const success = React.useCallback(
    (message: string, duration = 3000) =>
      showToast(message, 'success', duration),
    [showToast],
  )

  const error = React.useCallback(
    (message: string, duration = 4000) => showToast(message, 'error', duration),
    [showToast],
  )

  const warning = React.useCallback(
    (message: string, duration = 3500) =>
      showToast(message, 'warning', duration),
    [showToast],
  )

  const info = React.useCallback(
    (message: string, duration = 3000) => showToast(message, 'info', duration),
    [showToast],
  )

  const notification = React.useCallback(
    (message: string, options?: NotificationToastOptions) => {
      const toastOptions: ExternalToast = {
        action: options?.onOpen
          ? {
              label: 'Open',
              onClick: options.onOpen,
            }
          : undefined,
        duration: options?.duration ?? 5000,
        classNames: {
          icon: 'vybaa-notification-icon',
          toast: 'vybaa-notification-toast',
        },
        icon: options?.avatarUrl ? (
          <span className="inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
            <img
              alt={options.avatarAlt ?? ''}
              className="block aspect-square h-full w-full object-cover"
              src={options.avatarUrl}
            />
          </span>
        ) : undefined,
        style: {
          borderRadius: '16px',
          maxWidth: 'calc(100vw - 24px)',
          minWidth: '260px',
          padding: '14px 16px',
        },
      }

      void hapticFeedback.light()
      return sonnerToast.info(message, toastOptions)
    },
    [],
  )

  const loading = React.useCallback(
    (message: string) => showToast(message, 'loading', 0),
    [showToast],
  )

  const dismiss = React.useCallback((id: string | number) => {
    sonnerToast.dismiss(id)
  }, [])

  const value = React.useMemo(
    () => ({
      dismiss,
      error,
      info,
      loading,
      notification,
      showToast,
      success,
      warning,
    }),
    [dismiss, error, info, loading, notification, showToast, success, warning],
  )

  useEffect(() => {
    showToast(
      'Welcome to Vybaa! Your AI companion for self-reflection and personal growth.',
      'success',
      5000,
    )
  }, [top])

  //alert(top)

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          className: 'rounded-full',
          style: {
            borderRadius: '99999px',
            top: top,
            textAlign: 'center',
            // transform: `translateY(${Number(top)*4}px)`,
          },
        }}
        style={{
          textAlign: 'left',
          fontWeight: 'bold',
        }}
      />
    </ToastContext.Provider>
  )
}
