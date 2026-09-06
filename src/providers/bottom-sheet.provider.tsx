import { BottomNotchPadd } from '@/components/common/notch.component'
import { useKeyboard } from '@/components/layout'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { hapticFeedback } from '@/shared/haptic.util'
import { shouldAnimate } from '@/shared/utils/animation.util'
import { cn } from '@/shared/utils/helpers.util'
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
  size?: 'default' | 'semi-full'
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
      size: 'default' | 'semi-full'
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
          size: opts?.size ?? 'default',
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
        size: opts.size !== undefined ? opts.size : top.size,
      }
      return next
    })
  }, [])

  const dismiss = useCallback(() => {
    hapticFeedback.light()
    // Capture which sheet we intend to dismiss *now*.
    // This prevents "present then dismiss" in the same tick from closing the newly presented sheet.
    const currentStack = stackRef.current
    const idToRemove = currentStack[currentStack.length - 1]?.id
    if (!idToRemove) return
    setStack((prev) => prev.filter((s) => s.id !== idToRemove))
  }, [])

  const dismissAll = useCallback(() => {
    setStack([])
  }, [])

  const value = useMemo(
    () => ({ present, update, dismiss, dismissAll }),
    [present, update, dismiss, dismissAll],
  )

  const top = stack[stack.length - 1]
  const topElevation = top?.elevation ?? 12
  const topSize = top?.size ?? 'default'
  const sheetTitleId = top ? `${top.id}_title` : undefined
  const sheetZIndex = BOTTOM_SHEET_BASE_Z_INDEX + Math.max(2, topElevation)
  const shadow =
    topElevation > 0
      ? {
          boxShadow: `0 -${Math.max(2, topElevation)}px ${Math.max(8, topElevation * 4)}px rgba(0,0,0,0.4)`,
        }
      : undefined

  const { isKeyboardVisible } = useKeyboard()

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      <AnimatePresence initial={false}>
        {top && (
          <motion.div
            key={top.id}
            className="fixed inset-0 mx-auto w-full max-w-[400px]"
            style={{ zIndex: sheetZIndex }}
          >
            <motion.div
              aria-hidden
              className="fixed inset-0 bg-black/60"
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={shouldAnimate ? { opacity: 0 } : undefined}
              transition={{ duration: shouldAnimate ? 0.18 : 0 }}
              onClick={dismiss}
            />
            <div
              className="fixed inset-0 mx-auto w-full max-w-[400px]"
              onClick={dismiss}
            >
              <div
                className="bottom-05-mg pointer-events-none absolute left-1/2 flex max-h-[calc(100vh-(var(--safe-area-inset-top)+20px))] w-[calc(100%-17px)] !-translate-x-1/2 flex-col"
                onClick={(event) => event.stopPropagation()}
              >
                <motion.div
                  aria-labelledby={sheetTitleId}
                  aria-modal="true"
                  className={cn(
                    'pointer-events-auto w-full rounded-[30px] rounded-b-[40px] bg-card-light-50 p-5',
                    topSize === 'semi-full' && '',
                  )}
                  initial={
                    shouldAnimate ? { opacity: 0, scale: 0.985, y: 36 } : false
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    shouldAnimate
                      ? { opacity: 0, scale: 0.99, y: 28 }
                      : undefined
                  }
                  transition={
                    shouldAnimate
                      ? { type: 'spring', stiffness: 360, damping: 34 }
                      : { duration: 0 }
                  }
                  role="dialog"
                  style={shadow}
                >
                  <View
                    className={cn(
                      'flex-row items-center justify-between',
                      isKeyboardVisible && 'mb-7',
                    )}
                  >
                    {top.title ? (
                      <Text
                        className="text-lg font-bold font-bbh text-white"
                        id={sheetTitleId}
                      >
                        {top.title}
                      </Text>
                    ) : (
                      <View />
                    )}
                    {top.title && (
                      <TouchableOpacity
                        accessibilityLabel={`Close ${top.title}`}
                        className="h-11 w-11 items-center justify-center"
                        onPress={dismiss}
                      >
                        <RiCloseCircleFill size={27} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    className={cn(
                      'overflow-y-auto pr-1',
                      topSize === 'semi-full'
                        ? 'max-h-[calc(88dvh-112px)]'
                        : 'max-h-[70vh]',
                    )}
                  >
                    {top.content}
                  </View>
                  <BottomNotchPadd />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheetContext.Provider>
  )
}
