import { Icon } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { colors } from '@/shared/colors.shared'
import { cn } from '@/shared/utils/helpers.util'
import React, { useState } from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text className="text-white text-sm font-medium font-outfit mb-2">
            {label}
          </Text>
        )}
        
        <View
          className={cn(
            'relative flex flex-row items-center  bg-card-600 border rounded-full px-1 overflow-hidden transition-all',
            error ? 'border-danger-500' : 'border-card-500',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {leftIcon && (
            <View className="absolute left-4 flex items-center justify-center">
              {leftIcon}
            </View>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-4  bg-transparent text-white font-outfit text-[17px] outline-none',
              'placeholder:text-neutral-500',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              inputClassName
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 flex items-center justify-center p-1"
              tabIndex={-1}
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
          <Text className="text-danger-500 text-xs font-outfit mt-1">
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text className="text-neutral-500 text-xs font-outfit mt-1">
            {helperText}
          </Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'

