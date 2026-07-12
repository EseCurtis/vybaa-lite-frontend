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
  useEffect,
  useMemo,
  useRef,
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
  dismissAll: () => void
}

const BottomSheetContext = createContext<BottomSheetContextType | null>(null)
const BOTTOM_SHEET_BASE_Z_INDEX = 1000000

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
  const [stack, setStack] = useState<
    Array<{
      id: string
      content: React.ReactNode
      title?: string
      elevation: number
    }>
  >([])
  const idRef = useRef(0)
  const stackRef = useRef(stack)

  useEffect(() => {
    stackRef.current = stack
  }, [stack])

  const present = useCallback(
    (node: React.ReactNode, opts?: BottomSheetOptions) => {
      idRef.current += 1
      const id = `sheet_${Date.now()}_${idRef.current}`
      setStack((prev) => [
        ...prev,
        {
          id,
          content: node,
          title: opts?.title,
          elevation: opts?.elevation ?? 12,
        },
      ])
      // subtle haptic on open
      try {
        hapticFeedback?.light && hapticFeedback.light()
      } catch {}
    },
    [],
  )

  const update = useCallback((opts: BottomSheetOptions) => {
    setStack((prev) => {
      if (prev.length === 0) return prev
      const next = [...prev]
      const top = next[next.length - 1]
      next[next.length - 1] = {
        ...top,
        title: opts.title !== undefined ? opts.title : top.title,
        elevation:
          opts.elevation !== undefined ? opts.elevation : top.elevation,
      }
      return next
    })
  }, [])

  const dismiss = useCallback(() => {
    // Capture which sheet we intend to dismiss *now*.
    // This prevents "present then dismiss" in the same tick from closing the newly presented sheet.
    const currentStack = stackRef.current
    const idToRemove = currentStack[currentStack.length - 1]?.id
    if (!idToRemove) return
    setTimeout(
      () => {
        setStack((prev) => prev.filter((s) => s.id !== idToRemove))
      },
      shouldAnimate ? 200 : 0,
    )
  }, [])

  const dismissAll = useCallback(() => {
    setTimeout(
      () => {
        setStack([])
      },
      shouldAnimate ? 200 : 0,
    )
  }, [])

  const isOpen = stack.length > 0

  const value = useMemo(
    () => ({ present, update, dismiss, dismissAll }),
    [present, update, dismiss, dismissAll],
  )

  const top = stack[stack.length - 1]
  const topElevation = top?.elevation ?? 12
  const sheetZIndex = BOTTOM_SHEET_BASE_Z_INDEX + Math.max(2, topElevation)
  const shadow =
    topElevation > 0
      ? {
          boxShadow: `0 -${Math.max(2, topElevation)}px ${Math.max(8, topElevation * 4)}px rgba(0,0,0,0.4)`,
        }
      : undefined

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      {shouldAnimate ? (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 max-w-[400px] flex-1 mx-auto"
              style={{ zIndex: sheetZIndex }}
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
                <>
                  <View className="flex-row items-center justify-between mb-7">
                    {top?.title ? (
                      <Text className="text-white text-lg font-bold font-bbh">
                        {top.title}
                      </Text>
                    ) : (
                      <View />
                    )}
                    {top?.title && (
                      <TouchableOpacity onPress={dismiss}>
                        <RiCloseCircleFill size={27} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View className="max-h-[70vh] overflow-y-auto pr-1">
                    {top?.content}
                  </View>
                </>
                <BottomNotchPadd />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <>
          {isOpen && (
            <div
              className="fixed inset-0 max-w-[400px] flex-1 mx-auto"
              style={{ zIndex: sheetZIndex }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={dismiss} />
              <div
                className="bg-[#111111] rounded-t-2xl p-5 w-full border-t border-[#2a2a2a] absolute bottom-0 left-0"
                style={shadow}
              >
                <>
                  <View className="flex-row items-center justify-between mb-7">
                    {top?.title ? (
                      <Text className="text-white text-lg font-bold font-bbh">
                        {top.title}
                      </Text>
                    ) : (
                      <View />
                    )}
                    {top?.title && (
                      <TouchableOpacity onPress={dismiss}>
                        <RiCloseCircleFill size={27} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View className="max-h-[70vh] overflow-y-auto pr-1">
                    {top?.content}
                  </View>
                </>
              </div>
            </div>
          )}
        </>
      )}
    </BottomSheetContext.Provider>
  )
}
