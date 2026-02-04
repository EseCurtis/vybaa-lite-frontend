import { Icon } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useSafeAreaInsets } from '@/hooks/use-safe-area-insets.hook'
import { colors } from '@/shared/colors.shared'
import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => string
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  loading: (message: string) => string // Returns toast ID to dismiss later
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    const toast: Toast = { id, message, type, duration }
    
    setToasts((prev) => [...prev, toast])

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration = 3000) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message: string, duration = 4000) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const warning = useCallback((message: string, duration = 3500) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const info = useCallback((message: string, duration = 3000) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  const loading = useCallback((message: string) => {
    return showToast(message, 'loading', 0)
  }, [showToast])

  const value = useMemo(
    () => ({ showToast, success, error, warning, info, loading, dismiss }),
    [showToast, success, error, warning, info, loading, dismiss]
  )

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success-500/20',
          border: 'border-success-500/50',
          text: 'text-success-400',
          icon: 'CheckCircle' as const,
          iconColor: colors.success[400],
        }
      case 'error':
        return {
          bg: 'bg-danger-500/20',
          border: 'border-danger-500/50',
          text: 'text-danger-500',
          icon: 'XCircle' as const,
          iconColor: colors.danger[500],
        }
      case 'warning':
        return {
          bg: 'bg-warning-500/20',
          border: 'border-warning-500/50',
          text: 'text-warning-400',
          icon: 'AlertCircle' as const,
          iconColor: colors.warning[400],
        }
      case 'loading':
        return {
          bg: 'bg-card-700/95',
          border: 'border-card-500/50',
          text: 'text-white',
          icon: 'Loader2' as const,
          iconColor: colors.white,
        }
      default:
        return {
          bg: 'bg-card-700/95',
          border: 'border-card-500/50',
          text: 'text-white',
          icon: 'Info' as const,
          iconColor: colors.white,
        }
    }
  }

  const { top} = useSafeAreaInsets();

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{
        marginTop: top
      }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[30000] pointer-events-none">
        <div className="flex flex-col gap-2 items-center">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => {
              const styles = getToastStyles(toast.type)
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="pointer-events-auto"
                >
                  <View
                    className={`
                      ${styles.bg} ${styles.border}
                      border rounded-full px-4 py-3
                      backdrop-blur-md
                      shadow-lg
                      min-w-[200px] max-w-[100vw]
                      flex flex-row items-center gap-2
                    `}
                  >
                    {toast.type === 'loading' ? (
                      <div className="animate-spin">
                        <Icon
                          name="Loader2"
                          size="sm"
                          color={styles.iconColor}
                        />
                      </div>
                    ) : (
                      <Icon
                        name={styles.icon}
                        size="sm"
                        color={styles.iconColor}
                      />
                    )}
                    <Text className={`${styles.text} text-sm font-bbh font-medium`}>
                      {toast.message}
                    </Text>
                  </View>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}
