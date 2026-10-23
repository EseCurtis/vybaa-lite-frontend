import { Icon } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { colors } from '@/shared/colors.shared'
import { cn } from '@/shared/utils/helpers.util'
import React, { useId, useState } from 'react'

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  inputClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = 'text',
      className = '',
      containerClassName = '',
      inputClassName = '',
      disabled = false,
      id,
      'aria-describedby': describedBy,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const generatedId = useId()
    const inputId = id ?? generatedId
    const messageId = `${inputId}-message`
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-white text-sm font-medium font-bbh mb-2"
          >
            {label}
          </label>
        )}

        <View
          className={cn(
            'relative flex flex-row items-center bg-card-light-50 border-0 rounded-xl px-1 overflow-hidden transition-all',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          {leftIcon && (
            <View className="absolute left-4 flex items-center justify-center">
              {leftIcon}
            </View>
          )}

          <input
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [describedBy, error || helperText ? messageId : undefined]
                .filter(Boolean)
                .join(' ') || undefined
            }
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3  bg-transparent text-white font-bbh text-[17px] outline-none',
              'placeholder:text-card-lighter-3/70',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              inputClassName,
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 flex min-h-11 min-w-11 items-center justify-center p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              <Icon
                name={showPassword ? 'EyeOff' : 'Eye'}
                size="sm"
                color={colors.neutral[400]}
              />
            </button>
          )}

          {!isPassword && rightIcon && (
            <View className="absolute right-3 flex items-center justify-center">
              {rightIcon}
            </View>
          )}
        </View>

        {error && (
          <Text
            id={messageId}
            role="status"
            className="text-danger-500 text-xs font-bbh mt-1"
          >
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text
            id={messageId}
            className="text-card-lighter-3 text-xs font-bbh mt-1"
          >
            {helperText}
          </Text>
        )}
      </View>
    )
  },
)

Input.displayName = 'Input'
