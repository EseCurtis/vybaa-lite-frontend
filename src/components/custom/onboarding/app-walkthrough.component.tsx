import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import {
  hasCompletedWalkthrough,
  markWalkthroughCompleted,
} from '@/shared/onboarding/walkthrough.util'
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
} from '@remixicon/react'
import { useLocation } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react'
import { createPortal } from 'react-dom'

type WalkthroughStep = {
  description: string
  selector: string
  title: string
}

type WalkthroughDefinition = {
  id: string
  steps: WalkthroughStep[]
}

type TargetRect = {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

const TARGET_PADDING = 8
const TOOLTIP_EDGE_GAP = 16
const TOOLTIP_TARGET_GAP = 16
const TOOLTIP_WIDTH = 336
const TOOLTIP_HEIGHT_ESTIMATE = 230
const TARGET_WAIT_MS = 3_000

const WALKTHROUGHS: Record<string, WalkthroughDefinition> = {
  '/app/goal': {
    id: 'goals-library',
    steps: [
      {
        description:
          'Start a goal here. If you leave midway, the pencil and dot show that your draft is waiting.',
        selector: '[data-testid="goal-create-button"]',
        title: 'Create or continue a goal',
      },
      {
        description:
          'Move between goals in progress, paused goals, and ended history without losing your place.',
        selector: '[data-walkthrough="goal-library-tabs"]',
        title: 'Your goal library',
      },
    ],
  },
  '/app/home': {
    id: 'home-main',
    steps: [
      {
        description:
          'Turn something you care about into a trackable commitment. Your unfinished setup is saved as a draft.',
        selector: '[data-testid="home-action-new-goal"]',
        title: 'Start with a goal',
      },
      {
        description:
          'Talk through your day with a Rewind partner, then revisit the patterns your conversations reveal.',
        selector: '[data-testid="home-action-rewind"]',
        title: 'Reflect with Rewind',
      },
      {
        description:
          'Use the bottom bar to return Home, review every goal, create quickly, write in your Journal, or open your profile.',
        selector: '[data-walkthrough="main-navigation"]',
        title: 'Everything stays within reach',
      },
    ],
  },
  '/app/profile': {
    id: 'profile-main',
    steps: [
      {
        description:
          'This is how you appear across Vybaa. Use Edit whenever you want to update your photo, name, or username.',
        selector: '[data-walkthrough="profile-identity"]',
        title: 'Your Vybaa identity',
      },
      {
        description:
          'Open your Play Points, achievements, wellbeing patterns, and app settings from one place.',
        selector: '[data-walkthrough="profile-quick-actions"]',
        title: 'Your personal shortcuts',
      },
    ],
  },
  '/app/rewind': {
    id: 'rewind-main',
    steps: [
      {
        description:
          'Tap when you are ready to speak. Rewind listens, reflects with you, and closes the conversation gracefully.',
        selector: '[aria-label="Start your Rewind"]',
        title: 'Begin a live Rewind',
      },
      {
        description:
          'Open private or group discussions anytime. Locked partners can stay visible, but only available partners can reply.',
        selector: '[aria-label="Open Rewind text chats"]',
        title: 'Keep talking by text',
      },
      {
        description:
          'Choose the voice that fits you. Free accounts can switch between two partners; Pro unlocks the full lineup.',
        selector: '[aria-label^="Change Rewind partner"]',
        title: 'Your Rewind partner',
      },
    ],
  },
  '/app/rewind-chats': {
    id: 'rewind-discussions',
    steps: [
      {
        description:
          'Continue one-to-one conversations or open the group room. Only partners available to you can reply.',
        selector: '[data-walkthrough="discussion-intro"]',
        title: 'Your Rewind discussions',
      },
      {
        description:
          'Use this to return to live Rewind whenever you are done browsing conversations.',
        selector: '[data-testid="tab-header-back"]',
        title: 'Back to Rewind',
      },
    ],
  },
}

const REWIND_CONVERSATION_WALKTHROUGH: WalkthroughDefinition = {
  id: 'rewind-conversation',
  steps: [
    {
      description:
        'Tap here, or swipe right from the very left edge of the screen, to return to Discussions.',
      selector: '[data-testid="tab-header-back"]',
      title: 'A quicker way back',
    },
    {
      description:
        'Write naturally here. In group discussions, use @ to invite a specific available partner into the reply.',
      selector: '[aria-label="Message your Rewind partners"]',
      title: 'Keep the conversation going',
    },
    {
      description:
        'Mute proactive check-ins or open conversation settings whenever you want more control.',
      selector: '[aria-label="Chat settings"]',
      title: 'Conversation controls',
    },
  ],
}

function getWalkthroughDefinition(
  pathname: string,
): WalkthroughDefinition | null {
  if (/^\/app\/rewind-chat\/[^/]+$/.test(pathname)) {
    return REWIND_CONVERSATION_WALKTHROUGH
  }

  return WALKTHROUGHS[pathname] ?? null
}

function getVisibleTarget(selector: string): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>(selector)

  for (const target of targets) {
    const rect = target.getBoundingClientRect()
    const style = window.getComputedStyle(target)
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    ) {
      return target
    }
  }

  return null
}

function getTargetRect(target: HTMLElement): TargetRect {
  const rect = target.getBoundingClientRect()
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  }
}

function targetsAreReady(steps: WalkthroughStep[]): boolean {
  return steps.every((step) => getVisibleTarget(step.selector) !== null)
}

function SpotlightWalkthrough({
  definition,
  userId,
}: {
  definition: WalkthroughDefinition
  userId: string
}): ReactElement | null {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const actionButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const activeStep = definition.steps[activeStepIndex]

  const closeWalkthrough = useCallback((): void => {
    markWalkthroughCompleted(definition.id, userId)
    setIsOpen(false)
    previousFocusRef.current?.focus()
  }, [definition.id, userId])

  const updateTargetRect = useCallback((): void => {
    const target = getVisibleTarget(activeStep.selector)
    if (!target) {
      setTargetRect(null)
      return
    }

    setTargetRect(getTargetRect(target))
  }, [activeStep.selector])

  useEffect(() => {
    setActiveStepIndex(0)
    setIsOpen(false)
    setTargetRect(null)

    if (hasCompletedWalkthrough(definition.id, userId)) return

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      if (!targetsAreReady(definition.steps)) {
        if (Date.now() - startedAt >= TARGET_WAIT_MS) {
          window.clearInterval(interval)
        }
        return
      }

      window.clearInterval(interval)
      previousFocusRef.current = document.activeElement as HTMLElement | null
      setIsOpen(true)
    }, 120)

    return () => window.clearInterval(interval)
  }, [definition, userId])

  useEffect(() => {
    if (!isOpen) return

    const target = getVisibleTarget(activeStep.selector)
    if (!target) {
      setIsOpen(false)
      return
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    })

    updateTargetRect()
    const settleTimer = window.setTimeout(
      updateTargetRect,
      reduceMotion ? 0 : 260,
    )
    const handleViewportChange = (): void => updateTargetRect()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [activeStep.selector, isOpen, updateTargetRect])

  useEffect(() => {
    if (!isOpen || !targetRect) return
    actionButtonRef.current?.focus()
  }, [activeStepIndex, isOpen, targetRect])

  const goForward = useCallback((): void => {
    if (activeStepIndex === definition.steps.length - 1) {
      closeWalkthrough()
      return
    }
    setActiveStepIndex((current) => current + 1)
  }, [activeStepIndex, closeWalkthrough, definition.steps.length])

  const goBack = useCallback((): void => {
    setActiveStepIndex((current) => Math.max(0, current - 1))
  }, [])

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Tab') {
        const focusableElements =
          tooltipRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
          )
        if (!focusableElements?.length) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeWalkthrough()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goForward()
      }
      if (event.key === 'ArrowLeft' && activeStepIndex > 0) {
        event.preventDefault()
        goBack()
      }
    },
    [activeStepIndex, closeWalkthrough, goBack, goForward],
  )

  if (!isOpen || !targetRect || typeof document === 'undefined') return null

  const spotlightStyle: CSSProperties = {
    height: targetRect.height + TARGET_PADDING * 2,
    left: targetRect.left - TARGET_PADDING,
    top: targetRect.top - TARGET_PADDING,
    width: targetRect.width + TARGET_PADDING * 2,
  }
  const tooltipWidth = Math.min(
    TOOLTIP_WIDTH,
    window.innerWidth - TOOLTIP_EDGE_GAP * 2,
  )
  const centeredLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
  const tooltipLeft = Math.min(
    Math.max(TOOLTIP_EDGE_GAP, centeredLeft),
    window.innerWidth - tooltipWidth - TOOLTIP_EDGE_GAP,
  )
  const hasRoomBelow =
    targetRect.bottom + TOOLTIP_TARGET_GAP + TOOLTIP_HEIGHT_ESTIMATE <
    window.innerHeight
  const tooltipStyle: CSSProperties = {
    left: tooltipLeft,
    width: tooltipWidth,
    ...(hasRoomBelow
      ? { top: targetRect.bottom + TOOLTIP_TARGET_GAP }
      : { bottom: window.innerHeight - targetRect.top + TOOLTIP_TARGET_GAP }),
  }
  const isLastStep = activeStepIndex === definition.steps.length - 1

  return createPortal(
    <div
      className="fixed inset-0 z-[1000003] overflow-hidden"
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-3xl ring-2 ring-white transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
        style={{
          ...spotlightStyle,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 72%)',
        }}
      />

      <div
        ref={tooltipRef}
        aria-describedby="walkthrough-description"
        aria-labelledby="walkthrough-title"
        aria-modal="true"
        className="fixed max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-card-light p-5 shadow-2xl transition-[top,bottom,left] duration-200 motion-reduce:transition-none"
        role="dialog"
        style={tooltipStyle}
      >
        <View className="mb-4 flex-row items-center justify-between gap-4">
          <Text className="text-xs font-bold uppercase tracking-[0.16em] text-card-lighter-3">
            {activeStepIndex + 1} of {definition.steps.length}
          </Text>
          <Pressable
            accessibilityLabel="Skip walkthrough"
            className="min-h-11 rounded-full px-3 items-center justify-center"
            onPress={closeWalkthrough}
          >
            <Text className="text-sm font-bold text-card-lighter-2">Skip</Text>
          </Pressable>
        </View>

        <Text
          id="walkthrough-title"
          className="text-xl font-bold text-white"
        >
          {activeStep.title}
        </Text>
        <Text
          id="walkthrough-description"
          className="mt-2 text-sm leading-6 text-card-lighter-2"
        >
          {activeStep.description}
        </Text>

        <View className="mt-5 flex-row items-center justify-between gap-3">
          <View aria-hidden="true" className="flex-row items-center gap-1.5">
            {definition.steps.map((step, index) => (
              <View
                className={
                  index === activeStepIndex
                    ? 'h-2 w-5 rounded-full bg-white'
                    : 'size-2 rounded-full bg-card-lighter'
                }
                key={step.title}
              />
            ))}
          </View>
          <View className="flex-row items-center gap-2">
            {activeStepIndex > 0 ? (
              <Pressable
                accessibilityLabel="Previous walkthrough step"
                className="min-h-11 flex-row items-center gap-1 rounded-full bg-card-light-50 px-4"
                onPress={goBack}
              >
                <RiArrowLeftLine className="text-white" size={17} />
                <Text className="font-bold text-white">Back</Text>
              </Pressable>
            ) : null}
            <Pressable
              ref={actionButtonRef}
              accessibilityLabel={
                isLastStep ? 'Finish walkthrough' : 'Next walkthrough step'
              }
              className="min-h-11 flex-row items-center gap-1 rounded-full bg-white px-5"
              onPress={goForward}
            >
              <Text className="font-bold text-black">
                {isLastStep ? 'Done' : 'Next'}
              </Text>
              {isLastStep ? (
                <RiCheckLine className="text-black" size={17} />
              ) : (
                <RiArrowRightLine className="text-black" size={17} />
              )}
            </Pressable>
          </View>
        </View>
      </div>
    </div>,
    document.body,
  )
}

export function AppWalkthrough(): ReactElement | null {
  const location = useLocation()
  const { user } = useAuth()
  const definition = useMemo(
    () => getWalkthroughDefinition(location.pathname),
    [location.pathname],
  )

  if (!definition || !user) return null

  return (
    <SpotlightWalkthrough
      definition={definition}
      key={`${definition.id}:${user.id}`}
      userId={user.id}
    />
  )
}
