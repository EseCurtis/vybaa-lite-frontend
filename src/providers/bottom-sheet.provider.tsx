import { BottomNotchPadd } from '@/components/common/notch.component'
import { useKeyboard } from '@/components/layout'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { hapticFeedback } from '@/shared/haptic.util'
import { cn } from '@/shared/utils/helpers.util'
import { RiCloseCircleFill } from '@remixicon/react'
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

  const isOpen = stack.length > 0

  const value = useMemo(
    () => ({ present, update, dismiss, dismissAll }),
    [present, update, dismiss, dismissAll],
  )

  const top = stack[stack.length - 1]
  const topElevation = top?.elevation ?? 12
  const topSize = top?.size ?? 'default'
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
      {isOpen && (
        <>
          <div
            className="fixed top-0 bg-black/60 z-10 inset-0"
            onClick={dismiss}
          />

          <div
            className="fixed  inset-0 max-w-[400px] w-full flex-1 mx-auto"
            style={{ zIndex: sheetZIndex, top: '0' }}
          >
            <div className="fixed top-0  z-10 inset-0" onClick={dismiss} />
            <div className="bottom-05-mg z-[10] max-h-[calc(100vh-(var(--safe-area-inset-top)+20px))] flex flex-col absolute left-1/2 !-translate-x-1/2 w-[calc(100%-17px)]">
              <div
                className={cn(
                  'bg-card-light-50 rounded-[30px] rounded-b-[40px] p-5 w-full',
                  topSize === 'semi-full' && '',
                )}
                style={shadow}
              >
                <>
                  <View
                    className={cn(
                      'flex-row items-center justify-between ',
                      isKeyboardVisible && 'mb-7',
                    )}
                  >
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
                  <View
                    className={cn(
                      'overflow-y-auto pr-1',
                      topSize === 'semi-full'
                        ? 'max-h-[calc(88dvh-112px)]'
                        : 'max-h-[70vh]',
                    )}
                  >
                    {top?.content}
                  </View>
                </>
                <BottomNotchPadd />
              </div>
            </div>
          </div>
        </>
      )}
    </BottomSheetContext.Provider>
  )
}
