import { BottomNotchPadd } from '@/components/common/notch.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { hapticFeedback } from '@/shared/haptic.util'
import { shouldAnimate } from '@/shared/utils/animation.util'
import { RiCloseCircleFill } from '@remixicon/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type BottomSheetOptions = {
  title?: string
  elevation?: number
}

type BottomSheetContextType = {
  present: (content: React.ReactNode, options?: BottomSheetOptions) => void
  update: (options: BottomSheetOptions) => void
  dismiss: () => void
}

const BottomSheetContext = createContext<BottomSheetContextType | null>(null)

export const useBottomSheetController = () => {
  const ctx = useContext(BottomSheetContext)
  if (!ctx) throw new Error('BottomSheetProvider missing')
  return ctx
}

export const BottomSheetProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<React.ReactNode>(null)
  const [title, setTitle] = useState<string | undefined>()
  const [elevation, setElevation] = useState<number>(12)

  const present = useCallback(
    (node: React.ReactNode, opts?: BottomSheetOptions) => {
      setContent(node)
      setTitle(opts?.title)
      setElevation(opts?.elevation ?? 12)
      setIsOpen(true)
      // subtle haptic on open
      try {
        hapticFeedback?.light && hapticFeedback.light()
      } catch {}
    },
    [],
  )

  const update = useCallback((opts: BottomSheetOptions) => {
    if (opts.title !== undefined) setTitle(opts.title)
    if (opts.elevation !== undefined) setElevation(opts.elevation)
  }, [])

  const dismiss = useCallback(() => {
    setIsOpen(false)
    setTimeout(
      () => {
        setContent(null)
        setTitle(undefined)
      },
      shouldAnimate ? 200 : 0,
    )
  }, [])

  const shadow =
    elevation > 0
      ? {
          boxShadow: `0 -${Math.max(2, elevation)}px ${Math.max(8, elevation * 4)}px rgba(0,0,0,0.4)`,
        }
      : undefined

  const value = useMemo(
    () => ({ present, update, dismiss }),
    [present, update, dismiss],
  )

  const sheetContent = (
    <>
      <View className="items-center mb-4">
        <View className="w-12 h-1.5 bg-card-light-50 rounded-full" />
      </View>
      <View className="flex-row items-center justify-between mb-3">
        {title ? (
          <Text className="text-white text-lg font-bold font-bbh">{title}</Text>
        ) : (
          <View />
        )}
        {title && (
          <TouchableOpacity onPress={dismiss}>
            <RiCloseCircleFill size={32} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      <View className="max-h-[70vh] overflow-y-auto pr-1">{content}</View>
    </>
  )

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      {shouldAnimate ? (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute inset-0 "
              style={{ zIndex: Math.max(2, elevation) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={dismiss}
              />
              <motion.div
                className="bg-cardd rounded-t-2xl p-5 w-full  absolute bottom-0 left-0 "
                style={shadow}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 32, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 26,
                  mass: 0.8,
                }}
              >
                {sheetContent}
                <BottomNotchPadd />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <>
          {isOpen && (
            <div
              className="absolute inset-0"
              style={{ zIndex: Math.max(2, elevation) }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={dismiss} />
              <div
                className="bg-[#111111] rounded-t-2xl p-5 w-full border-t border-[#2a2a2a] absolute bottom-0 left-0"
                style={shadow}
              >
                {sheetContent}
              </div>
            </div>
          )}
        </>
      )}
    </BottomSheetContext.Provider>
  )
}
