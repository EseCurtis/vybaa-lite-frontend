import { cn } from './helpers.util'

/**
 * Examples demonstrating the cn() utility function capabilities
 * This file shows various ways to use the cn() function for Tailwind class merging
 */

// Example 1: Basic class merging
export const basicExample = () => {
  const baseClasses = "px-4 py-2 rounded-lg"
  const variantClasses = "bg-blue-500 text-white"
  
  return cn(baseClasses, variantClasses)
  // Result: "px-4 py-2 rounded-lg bg-blue-500 text-white"
}

// Example 2: Conditional classes
export const conditionalExample = (isActive: boolean, isError: boolean) => {
  return cn(
    "px-4 py-2 rounded-lg transition-colors",
    isActive && "bg-primary-500 text-white",
    isError && "bg-danger-500 text-white",
    !isActive && !isError && "bg-gray-200 text-gray-800"
  )
}

// Example 3: Object syntax for conditions
export const objectSyntaxExample = (props: {
  variant: 'primary' | 'secondary' | 'danger'
  size: 'sm' | 'md' | 'lg'
  disabled: boolean
}) => {
  return cn(
    "px-4 py-2 rounded-lg font-medium transition-colors",
    {
      // Variant styles
      'bg-primary-500 text-white hover:bg-primary-600': props.variant === 'primary',
      'bg-secondary-500 text-white hover:bg-secondary-600': props.variant === 'secondary',
      'bg-danger-500 text-white hover:bg-danger-600': props.variant === 'danger',
      
      // Size styles
      'px-2 py-1 text-sm': props.size === 'sm',
      'px-4 py-2 text-base': props.size === 'md',
      'px-6 py-3 text-lg': props.size === 'lg',
      
      // Disabled state
      'opacity-50 cursor-not-allowed': props.disabled,
      'cursor-pointer hover:shadow-md': !props.disabled
    }
  )
}

// Example 4: Tailwind class conflicts resolution
export const conflictResolutionExample = () => {
  // tailwind-merge will resolve conflicts intelligently
  return cn(
    "px-2 py-1", // These will be overridden
    "px-4 py-2", // These will be kept
    "text-red-500", // This will be overridden
    "text-blue-500" // This will be kept
  )
  // Result: "px-4 py-2 text-blue-500" (conflicts resolved)
}

// Example 5: Complex component styling
export const complexComponentExample = (props: {
  isSelected: boolean
  isHovered: boolean
  variant: 'card' | 'button'
  size: 'sm' | 'md' | 'lg'
}) => {
  return cn(
    // Base styles
    "transition-all duration-200",
    
    // Variant-specific styles
    props.variant === 'card' && [
      "bg-card-500 rounded-3xl p-4",
      "hover:bg-card-400 hover:shadow-lg",
      "border border-card-300"
    ],
    
    props.variant === 'button' && [
      "bg-primary-500 text-white rounded-lg",
      "hover:bg-primary-600 active:bg-primary-700",
      "focus:ring-2 focus:ring-primary-300"
    ],
    
    // Size styles
    {
      'p-2 text-sm': props.size === 'sm',
      'p-4 text-base': props.size === 'md',
      'p-6 text-lg': props.size === 'lg'
    },
    
    // State styles
    props.isSelected && "ring-2 ring-primary-500",
    props.isHovered && "scale-105 shadow-xl"
  )
}

// Example 6: Using with your custom colors
export const customColorsExample = (theme: 'light' | 'dark') => {
  return cn(
    "p-4 rounded-lg font-mona",
    theme === 'light' && [
      "bg-neutral-100 text-neutral-900",
      "border border-neutral-200"
    ],
    theme === 'dark' && [
      "bg-card-500 text-white",
      "border border-card-300"
    ]
  )
}

// Example 7: Responsive and state variants
export const responsiveExample = () => {
  return cn(
    "grid gap-2 p-4",
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "bg-card-500 rounded-3xl",
    "hover:bg-card-400 transition-colors",
    "focus-within:ring-2 focus-within:ring-primary-500"
  )
}

