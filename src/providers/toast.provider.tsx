import React from 'react'
import { Toaster } from 'sonner'
import { useSafeAreaInsets } from '@/hooks/use-safe-area-insets.hook'
import { toast as sonnerToast } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => string | number
  success: (message: string, duration?: number) => string | number
  error: (message: string, duration?: number) => string | number
  warning: (message: string, duration?: number) => string | number
  info: (message: string, duration?: number) => string | number
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
      const options: any = {
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
    []
  )

  const success = React.useCallback(
    (message: string, duration = 3000) => showToast(message, 'success', duration),
    [showToast]
  )

  const error = React.useCallback(
    (message: string, duration = 4000) => showToast(message, 'error', duration),
    [showToast]
  )

  const warning = React.useCallback(
    (message: string, duration = 3500) => showToast(message, 'warning', duration),
    [showToast]
  )

  const info = React.useCallback(
    (message: string, duration = 3000) => showToast(message, 'info', duration),
    [showToast]
  )

  const loading = React.useCallback(
    (message: string) => showToast(message, 'loading', 0),
    [showToast]
  )

  const dismiss = React.useCallback((id: string | number) => {
    sonnerToast.dismiss(id)
  }, [])

  const value = React.useMemo(
    () => ({ showToast, success, error, warning, info, loading, dismiss }),
    [showToast, success, error, warning, info, loading, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-center"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          className: 'rounded-full',
          style: {
            borderRadius: '9999px',
          },
        }}
        style={{
          marginTop: `${top}px`,
        }}
      />
    </ToastContext.Provider>
  )
}
