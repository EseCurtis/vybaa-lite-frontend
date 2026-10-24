import { getWalkthroughDefinition } from '@/shared/onboarding/walkthrough.config'
import type {
  WalkthroughDefinition,
  WalkthroughStep,
} from '@/shared/onboarding/walkthrough.config'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import {
  hasCompletedWalkthrough,
  markWalkthroughCompleted,
} from '@/shared/onboarding/walkthrough.util'
import {
  intersectWalkthroughRects,
  walkthroughLayout,
} from '@/shared/onboarding/walkthrough-layout'
import type { WalkthroughRect } from '@/shared/onboarding/walkthrough-layout'
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
} from '@remixicon/react'
import { useLocation } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'

const TARGET_WAIT_MS = 3_000

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

function safeAreaInset(style: CSSStyleDeclaration, edge: string): number {
  const value = Number(
    style
      .getPropertyValue(`--safe-area-inset-${edge}`)
      .trim()
      .replace(/px$/, ''),
  )
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function getViewportRect(): WalkthroughRect {
  const viewport = window.visualViewport
  const style = window.getComputedStyle(document.documentElement)
  const left = (viewport?.offsetLeft ?? 0) + safeAreaInset(style, 'left')
  const top = (viewport?.offsetTop ?? 0) + safeAreaInset(style, 'top')
  const right =
    (viewport?.offsetLeft ?? 0) +
    (viewport?.width ?? window.innerWidth) -
    safeAreaInset(style, 'right')
  const bottom =
    (viewport?.offsetTop ?? 0) +
    (viewport?.height ?? window.innerHeight) -
    safeAreaInset(style, 'bottom')
  return {
    bottom,
    height: Math.max(0, bottom - top),
    left,
    right,
    top,
    width: Math.max(0, right - left),
  }
}

function getClippedTargetRect(
  target: HTMLElement,
  viewport: WalkthroughRect,
): WalkthroughRect | null {
  let rect = intersectWalkthroughRects(target.getBoundingClientRect(), viewport)
  for (
    let parent = target.parentElement;
    parent && rect;
    parent = parent.parentElement
  ) {
    const style = window.getComputedStyle(parent)
    const clipX = /auto|scroll|hidden|clip|overlay/.test(
      style.overflowX || style.overflow,
    )
    const clipY = /auto|scroll|hidden|clip|overlay/.test(
      style.overflowY || style.overflow,
    )
    if (!clipX && !clipY) continue
    const bounds = parent.getBoundingClientRect()
    rect = intersectWalkthroughRects(rect, {
      bottom: clipY ? bounds.bottom : rect.bottom,
      height: clipY ? bounds.height : rect.height,
      left: clipX ? bounds.left : rect.left,
      right: clipX ? bounds.right : rect.right,
      top: clipY ? bounds.top : rect.top,
      width: clipX ? bounds.width : rect.width,
    })
  }
  return rect
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
  const [steps, setSteps] = useState(definition.steps)
  const [isOpen, setIsOpen] = useState(false)
  const [geometry, setGeometry] = useState<{
    target: WalkthroughRect | null
    viewport: WalkthroughRect
  } | null>(null)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const actionButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const activeStep = steps[activeStepIndex]

  const closeWalkthrough = useCallback((): void => {
    markWalkthroughCompleted(definition.id, userId)
    setIsOpen(false)
    previousFocusRef.current?.focus({ preventScroll: true })
  }, [definition.id, userId])

  const updateTargetRect = useCallback((): void => {
    const target = getVisibleTarget(activeStep.selector)
    const viewport = getViewportRect()
    setGeometry({
      target: target ? getClippedTargetRect(target, viewport) : null,
      viewport,
    })
  }, [activeStep.selector])

  useEffect(() => {
    setActiveStepIndex(0)
    setIsOpen(false)
    setGeometry(null)
    setSteps(definition.steps)

    if (hasCompletedWalkthrough(definition.id, userId)) return

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      if (!targetsAreReady(definition.steps)) {
        if (Date.now() - startedAt >= TARGET_WAIT_MS) {
          window.clearInterval(interval)
          const available = definition.steps.filter((step) =>
            getVisibleTarget(step.selector),
          )
          if (!available.length) return
          setSteps(available)
          previousFocusRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
          markWalkthroughCompleted(definition.id, userId)
          setIsOpen(true)
        }
        return
      }

      window.clearInterval(interval)
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      // Record the walkthrough as seen when it opens. If the user navigates
      // away before pressing Skip or Done, it should not surprise them again.
      markWalkthroughCompleted(definition.id, userId)
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
    let frame: number | null = null
    const handleViewportChange = (): void => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        updateTargetRect()
      })
    }
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(handleViewportChange)
    for (
      let element: HTMLElement | null = target;
      element;
      element = element.parentElement
    ) {
      observer?.observe(element)
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [activeStep.selector, isOpen, updateTargetRect])

  const positioned = geometry !== null
  useLayoutEffect(() => {
    if (!isOpen || !positioned) return
    const tooltip = tooltipRef.current
    if (!tooltip) return
    const measure = (): void =>
      setTooltipHeight(tooltip.getBoundingClientRect().height)
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(tooltip)
    return () => observer?.disconnect()
  }, [activeStepIndex, isOpen, positioned])

  useEffect(() => {
    if (!isOpen || !positioned) return
    actionButtonRef.current?.focus({ preventScroll: true })
  }, [activeStepIndex, isOpen, positioned])

  const goForward = useCallback((): void => {
    if (activeStepIndex === steps.length - 1) {
      closeWalkthrough()
      return
    }
    setActiveStepIndex((current) => current + 1)
  }, [activeStepIndex, closeWalkthrough, steps.length])

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

  if (!isOpen || !geometry || typeof document === 'undefined') return null

  const { spotlight, tooltip } = walkthroughLayout(
    geometry.target,
    geometry.viewport,
    tooltipHeight,
  )
  const isLastStep = activeStepIndex === steps.length - 1

  return createPortal(
    <div
      className="fixed inset-0 z-[1000003] overflow-hidden"
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      {!spotlight ? (
        <div aria-hidden="true" className="fixed inset-0 bg-black/70" />
      ) : (
        <div
          aria-hidden="true"
          data-walkthrough-spotlight
          className="pointer-events-none fixed rounded-3xl ring-2 ring-white transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
          style={{
            height: spotlight.height,
            left: spotlight.left,
            top: spotlight.top,
            width: spotlight.width,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 72%)',
          }}
        />
      )}

      <div
        ref={tooltipRef}
        aria-describedby="walkthrough-description"
        aria-labelledby="walkthrough-title"
        aria-modal="true"
        className="fixed flex min-h-0 flex-col overflow-hidden rounded-3xl bg-card-light p-[20px] shadow-2xl"
        role="dialog"
        style={tooltip}
      >
        <View className="mb-[16px] shrink-0 flex-row items-center justify-between gap-4">
          <Text className="text-xs font-bold uppercase tracking-[0.16em] text-card-lighter-3">
            {activeStepIndex + 1} of {steps.length}
          </Text>
          <Pressable
            accessibilityLabel="Skip walkthrough"
            className="min-h-[44px] rounded-full px-[12px] items-center justify-center"
            onPress={closeWalkthrough}
          >
            <Text className="text-sm font-bold text-card-lighter-2">Skip</Text>
          </Pressable>
        </View>

        <div className="min-h-0 overflow-y-auto overscroll-contain [overflow-wrap:anywhere]">
          <Text
            id="walkthrough-title"
            className="block text-xl pr-1 font-bold text-white"
          >
            {activeStep.title}
          </Text>
          <Text
            id="walkthrough-description"
            className="mt-2 block text-sm leading-6 text-card-lighter-2"
          >
            {activeStep.description}
          </Text>
        </div>

        <View className="mt-[20px] shrink-0 flex-row flex-wrap items-center justify-between gap-[12px]">
          <View aria-hidden="true" className="flex-row items-center gap-1.5">
            {steps.map((step, index) => (
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
          <View className="min-w-0 flex-row flex-wrap items-center gap-[8px]">
            {activeStepIndex > 0 ? (
              <Pressable
                accessibilityLabel="Previous walkthrough step"
                className="min-h-[44px] flex-row items-center gap-[4px] rounded-full bg-card-light-50 px-[16px]"
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
              className="min-h-[44px] flex-row items-center gap-[4px] rounded-full bg-white px-[20px]"
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
