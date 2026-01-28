import { cn } from '@/shared/utils/helpers.util'
import { getAnimationDuration } from '@/shared/utils/animation.util'
import { KeyboardUtil, type KeyboardInfo } from '@/shared/utils/keyboard.util'
import { Capacitor } from '@capacitor/core'
import type { HTMLAttributes } from 'react'
import React, { useEffect, useRef, useState } from 'react'

export interface KeyboardAvoidingViewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Behavior for keyboard avoidance
   * - 'padding': Adjusts padding to avoid keyboard
   * - 'height': Adjusts height to avoid keyboard
   * - 'position': Adjusts position to avoid keyboard
   */
  behavior?: 'padding' | 'height' | 'position'
  
  /**
   * Offset to add/subtract from keyboard height
   */
  keyboardVerticalOffset?: number
  
  /**
   * Whether to enable keyboard avoidance on web platform
   */
  enableOnWeb?: boolean
  
  /**
   * Animation duration for keyboard transitions (in ms)
   */
  animationDuration?: number
  
  /**
   * Whether to automatically scroll focused input into view
   */
  autoScrollToFocusedInput?: boolean
  
  /**
   * Custom content to render
   */
  children: React.ReactNode
}

/**
 * Enhanced KeyboardAvoidingView component with web support
 * Automatically adjusts layout to avoid keyboard on all platforms
 */
export const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps> = ({
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  enableOnWeb = false,
  animationDuration: providedDuration = 250,
  autoScrollToFocusedInput = true,
  children,
  className,
  style,
  ...rest
}) => {
  // Disable animations on Android
  const animationDuration = getAnimationDuration(providedDuration)
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    keyboardHeight: 0,
    isKeyboardVisible: false
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const webKeyboardHeight = useRef(0)

  // Web keyboard detection
  useEffect(() => {
    if (!enableOnWeb || Capacitor.isNativePlatform()) {
      return
    }

    const handleResize = () => {
      const initialViewportHeight = window.visualViewport?.height || window.innerHeight
      const currentViewportHeight = window.innerHeight
      const keyboardHeight = Math.max(0, initialViewportHeight - currentViewportHeight)
      
      webKeyboardHeight.current = keyboardHeight
      
      setKeyboardInfo({
        keyboardHeight,
        isKeyboardVisible: keyboardHeight > 0
      })
    }

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = Math.max(0, window.innerHeight - window.visualViewport.height)
        webKeyboardHeight.current = keyboardHeight
        
        setKeyboardInfo({
          keyboardHeight,
          isKeyboardVisible: keyboardHeight > 0
        })
      }
    }

    // Listen for viewport changes (better keyboard detection on mobile web)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
    } else {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [enableOnWeb])

  useEffect(() => {
    // Only initialize Capacitor keyboard on native platforms
    const shouldInitialize = Capacitor.isNativePlatform()
    
    if (!shouldInitialize || isInitialized.current) {
      return
    }

    const initializeKeyboard = async () => {
      await KeyboardUtil.initialize()
      isInitialized.current = true
    }

    initializeKeyboard()

    // Add keyboard listener for native platforms
    const unsubscribe = KeyboardUtil.addListener((info) => {
      setKeyboardInfo(info)
      
      // Auto-scroll focused input into view if enabled
      if (autoScrollToFocusedInput && info.isKeyboardVisible) {
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement
          if (activeElement && containerRef.current) {
            activeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 100)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [autoScrollToFocusedInput])

  // Calculate the adjustment value based on behavior
  const getAdjustmentValue = (): number => {
    if (!keyboardInfo.isKeyboardVisible) return 0
    
    const adjustedHeight = Math.max(0, keyboardInfo.keyboardHeight - keyboardVerticalOffset)
    return adjustedHeight
  }

  // Generate dynamic styles based on behavior
  const getDynamicStyles = (): React.CSSProperties => {
    const adjustment = getAdjustmentValue()
    
    if (adjustment === 0) {
      return {
        transition: `all ${animationDuration}ms ease-in-out`
      }
    }

    switch (behavior) {
      case 'padding':
        return {
          paddingBottom: `${adjustment}px`,
          transition: `padding-bottom ${animationDuration}ms ease-in-out`
        }
      
      case 'height':
        return {
          height: `calc(100vh - ${adjustment}px)`,
          transition: `height ${animationDuration}ms ease-in-out`
        }
      
      case 'position':
        return {
          transform: `translateY(-${adjustment}px)`,
          transition: `transform ${animationDuration}ms ease-in-out`
        }
      
      default:
        return {}
    }
  }

  // Combine provided styles with dynamic styles
  const combinedStyle: React.CSSProperties = {
    ...style,
    ...getDynamicStyles()
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'keyboard-avoiding-view',
        'flex flex-col',
        className
      )}
      style={combinedStyle}
      {...rest}
    >
      {children}
    </div>
  )
}

/**
 * Hook for accessing keyboard state and utilities
 */
export const useKeyboard = () => {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    keyboardHeight: 0,
    isKeyboardVisible: false
  })

  useEffect(() => {
    const unsubscribe = KeyboardUtil.addListener(setKeyboardInfo)
    return unsubscribe
  }, [])

  return {
    ...keyboardInfo,
    hideKeyboard: KeyboardUtil.hideKeyboard,
    showKeyboard: KeyboardUtil.showKeyboard,
    setResizeMode: KeyboardUtil.setResizeMode,
    setScrollMode: KeyboardUtil.setScrollMode
  }
}

export default KeyboardAvoidingView