import { cn } from '@/shared/utils/helpers.util'
import React from 'react'

// Base pressable interface
interface BasePressableProps {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  onPress?: () => void
  onPressIn?: () => void
  onPressOut?: () => void
  onLongPress?: () => void
  style?: React.CSSProperties
  testID?: string
  accessibilityLabel?: string
  accessibilityRole?: string
  accessibilityHint?: string
}

// TouchableOpacity specific props
interface TouchableOpacityProps extends BasePressableProps {
  activeOpacity?: number
  delayPressIn?: number
  delayPressOut?: number
  delayLongPress?: number
}

// Pressable specific props
interface PressableProps extends BasePressableProps {
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number }
  pressRetentionOffset?: number | { top?: number; bottom?: number; left?: number; right?: number }
  android_disableSound?: boolean
  android_ripple?: {
    color?: string
    borderless?: boolean
    radius?: number
  }
}

// TouchableOpacity Component
export const TouchableOpacity = React.forwardRef<HTMLButtonElement, TouchableOpacityProps>(
  (
    {
      children,
      className = '',
      disabled = false,
      activeOpacity = 0.7,
      delayPressIn = 0,
      delayPressOut = 0,
      delayLongPress = 500,
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      style,
      testID,
      accessibilityLabel,
      accessibilityRole = 'button',
      accessibilityHint,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    //@ts-ignore
    const pressTimeoutRef = React.useRef<NodeJS.Timeout>()
    //@ts-ignore
    const longPressTimeoutRef = React.useRef<NodeJS.Timeout>()

    const handleMouseDown = React.useCallback(() => {
      if (disabled) return
      
      if (delayPressIn > 0) {
        pressTimeoutRef.current = setTimeout(() => {
          setIsPressed(true)
          onPressIn?.()
        }, delayPressIn)
      } else {
        setIsPressed(true)
        onPressIn?.()
      }
    }, [disabled, delayPressIn, onPressIn])

    const handleMouseUp = React.useCallback(() => {
      if (disabled) return
      
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
      }
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
      
      if (delayPressOut > 0) {
        setTimeout(() => {
          setIsPressed(false)
          onPressOut?.()
        }, delayPressOut)
      } else {
        setIsPressed(false)
        onPressOut?.()
      }
    }, [disabled, delayPressOut, onPressOut])

    const handleClick = React.useCallback(() => {
      if (disabled) return
      onPress?.()
    }, [disabled, onPress])

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false)
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
      }
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
      setIsPressed(false)
    }, [])

    const handleMouseDownWithLongPress = React.useCallback(() => {
      if (disabled || !onLongPress) return
      
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress()
      }, delayLongPress)
    }, [disabled, onLongPress, delayLongPress])

    React.useEffect(() => {
      return () => {
        if (pressTimeoutRef.current) {
          clearTimeout(pressTimeoutRef.current)
        }
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current)
        }
      }
    }, [])

    const opacity = React.useMemo(() => {
      if (disabled) return 0.5
      if (isPressed) return activeOpacity
      if (isHovered) return 0.8
      return 1
    }, [disabled, isPressed, isHovered, activeOpacity])

    return (
      <button
        ref={ref}
        className={cn(
          'flex cursor-pointer transition-opacity duration-150',
          disabled && 'cursor-not-allowed',
          className
        )}
        style={{
          ...style,
          opacity,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDownCapture={handleMouseDownWithLongPress}
        disabled={disabled}
        data-testid={testID}
        aria-label={accessibilityLabel}
        role={accessibilityRole}
        aria-describedby={accessibilityHint}
        {...props}
      >
        {children}
      </button>
    )
  }
)

TouchableOpacity.displayName = 'TouchableOpacity'

// Pressable Component
export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  (
    {
      children,
      className = '',
      disabled = false,
      hitSlop,
      pressRetentionOffset,
      android_disableSound,
      android_ripple,
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      style,
      testID,
      accessibilityLabel,
      accessibilityRole = 'button',
      accessibilityHint,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    //@ts-ignore
    const pressTimeoutRef = React.useRef<NodeJS.Timeout>()
    //@ts-ignore
    const longPressTimeoutRef = React.useRef<NodeJS.Timeout>()

    const handleMouseDown = React.useCallback(() => {
      if (disabled) return
      
      setIsPressed(true)
      onPressIn?.()
      
      if (onLongPress) {
        longPressTimeoutRef.current = setTimeout(() => {
          onLongPress()
        }, 500) // Default long press delay
      }
    }, [disabled, onPressIn, onLongPress])

    const handleMouseUp = React.useCallback(() => {
      if (disabled) return
      
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
      
      setIsPressed(false)
      onPressOut?.()
    }, [disabled, onPressOut])

    const handleClick = React.useCallback(() => {
      if (disabled) return
      onPress?.()
    }, [disabled, onPress])

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false)
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
      setIsPressed(false)
    }, [])

    React.useEffect(() => {
      return () => {
        if (pressTimeoutRef.current) {
          clearTimeout(pressTimeoutRef.current)
        }
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current)
        }
      }
    }, [])

    // Calculate hit area based on hitSlop
    const hitAreaStyle = React.useMemo(() => {
      if (!hitSlop) return {}
      
      if (typeof hitSlop === 'number') {
        return {
          padding: `${hitSlop}px`,
          margin: `-${hitSlop}px`,
        }
      }
      
      return {
        paddingTop: hitSlop.top ? `${hitSlop.top}px` : undefined,
        paddingBottom: hitSlop.bottom ? `${hitSlop.bottom}px` : undefined,
        paddingLeft: hitSlop.left ? `${hitSlop.left}px` : undefined,
        paddingRight: hitSlop.right ? `${hitSlop.right}px` : undefined,
        marginTop: hitSlop.top ? `-${hitSlop.top}px` : undefined,
        marginBottom: hitSlop.bottom ? `-${hitSlop.bottom}px` : undefined,
        marginLeft: hitSlop.left ? `-${hitSlop.left}px` : undefined,
        marginRight: hitSlop.right ? `-${hitSlop.right}px` : undefined,
      }
    }, [hitSlop])

    return (
      <button
        ref={ref}
        className={cn(
          'flex active:scale-[.97] cursor-pointer transition-all duration-150',
          disabled && 'cursor-not-allowed',
          isPressed && 'active:scale-105',
          //isHovered && 'scale-105',
          className
        )}
        style={{
          ...style,
          ...hitAreaStyle,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        data-testid={testID}
        aria-label={accessibilityLabel}
        role={accessibilityRole}
        aria-describedby={accessibilityHint}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Pressable.displayName = 'Pressable'



