/* eslint-disable max-lines-per-function */
import { Icon } from '@/components/layout/icon.component'
import { LinearGradient } from '@/components/layout/linear-gradient.component'
import { Text } from '@/components/layout/text.component'
import { colors } from '@/shared/colors.shared'
import { cn } from '@/shared/utils/helpers.util'
import React from 'react'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

const button = tv({
  slots: {
    container:
      'flex flex-row items-center justify-center gap-2 rounded-full px-10 transition-all duration-200',
    label: 'font-outfit text-base font-semibold',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      default: {
        label: 'text-black',
        indicator: 'text-black',
      },
      secondary: {
        label: 'text-white',
        indicator: 'text-white',
      },
      outline: {
        container: 'border border-neutral-400',
        label: '!text-white',
        indicator: 'text-white',
      },
      destructive: {
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        label: 'text-black underline',
        indicator: 'text-black',
      },
      link: {
        container: 'h-auto',
        label: 'text-white',
        indicator: 'text-white',
      },
    },
    size: {
      default: {
        container: 'h-[50px] px-10',
        label: 'text-xl',
      },
      lg: {
        container: 'h-16 px-10',
        label: 'text-xl',
      },
      sm: {
        container: 'h-10 px-4',
        label: 'text-sm',
        indicator: 'h-2',
      },
      icon: { container: 'size-10 p-0' },
    },
    disabled: {
      true: {
        container: 'bg-card-500',
        label: 'text-neutral-400',
        indicator: 'text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: 'w-full',
      },
      false: {
        container: 'w-fit self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: false,
    size: 'default',
  },
})

type ButtonVariants = VariantProps<typeof button>

interface ButtonProps
  extends ButtonVariants,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  label?: string | number
  loading?: boolean
  className?: string
  textClassName?: string
  withIcon?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      label: text,
      loading = false,
      variant = 'default',
      disabled = false,
      size = 'default',
      fullWidth = false,
      className = '',
      textClassName = '',
      withIcon = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size, fullWidth }),
      [variant, disabled, size, fullWidth]
    )

    const gradientColors = React.useMemo(() => {
      if (variant === 'default') {
        return [colors.white, colors.white]
      }
      if (variant === 'secondary') {
        return [colors.card[500], colors.card[500]]
      }
      if (variant === 'outline') {
        return ['transparent', 'transparent']
      }
      if (variant === 'destructive') {
        return [colors.danger[500], colors.danger[500]]
      }
      if (variant === 'ghost') {
        return ['transparent', 'transparent']
      }
      if (variant === 'link') {
        return ['transparent', 'transparent']
      }
      return [colors.white, colors.white]
    }, [variant])

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'cursor-pointer',
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90',
          loading ? '!pr-0' : '',
         
        )}
        {...props}
      >
        <LinearGradient
          className={styles.container({ className })}
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {children ? (
            <>{children}</>
          ) : (
            <>
              {loading ? (
                <div
                  className={cn(
                    'animate-spin rounded-full border-2 border-t-transparent',
                    styles.indicator()
                  )}
                  style={{ width: '20px', height: '20px' }}
                  role="status"
                  aria-label="Loading"
                />
              ) : (
                <>
                  {leftIcon}
                  {text && (
                    <Text
                      className={cn('!text-black', styles.label({ className: textClassName }))}
                    >
                      {text}
                    </Text>
                  )}
                  {rightIcon ? (
                    rightIcon
                  ) : withIcon ? (
                    <Icon name="ArrowRight" size="md" color="currentColor" />
                  ) : null}
                </>
              )}
            </>
          )}
        </LinearGradient>
      </button>
    )
  }
)

Button.displayName = 'Button'
