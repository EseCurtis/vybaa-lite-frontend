import { shouldAnimate } from '@/shared/utils/animation.util'
import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ModalOptions = {
  dismissible?: boolean
  elevation?: number
}

type ModalContextType = {
  present: (content: React.ReactNode, options?: ModalOptions) => void
  dismiss: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export const useModalController = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('ModalProvider missing')
  return ctx
}

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<React.ReactNode>(null)
  const [dismissible, setDismissible] = useState(true)
  const [elevation, setElevation] = useState(20)

  const present = useCallback((node: React.ReactNode, opts?: ModalOptions) => {
    setContent(node)
    setDismissible(opts?.dismissible ?? true)
    setElevation(opts?.elevation ?? 20)
    setIsOpen(true)
  }, [])

  const dismiss = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setContent(null), shouldAnimate ? 220 : 0)
  }, [])

  const value = useMemo(() => ({ present, dismiss }), [present, dismiss])

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[20000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissible ? dismiss : undefined}
            />
            <motion.div
              className="absolute inset-0"
              style={{ zIndex: elevation }}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.995 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  )
}




