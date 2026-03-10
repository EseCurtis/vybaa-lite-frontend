import { cn } from '@/shared/utils/helpers.util'
import * as LucideIcons from 'lucide-react'
import React from 'react'

// Extract all Lucide icon names for type safety
type LucideIconName = keyof typeof LucideIcons

// Icon size variants
const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const

type IconSize = keyof typeof iconSizes

interface IconProps {
  name: LucideIconName
  size?: IconSize | number
  className?: string
  color?: string
  strokeWidth?: number
  fill?: string
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
  'aria-hidden'?: boolean
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  color,
  strokeWidth = 2,
  fill = 'none',
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const IconComponent = LucideIcons[name] as React.ComponentType<any>

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide React`)
    return null
  }

  const sizeClass = typeof size === 'number' ? '' : iconSizes[size]
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : {}

  return (
    <IconComponent
      className={cn(
        sizeClass,
        disabled && 'opacity-50 cursor-not-allowed',
        onClick && !disabled && 'cursor-pointer',
        className
      )}
      style={{
        ...sizeStyle,
        color,
        fill,
      }}
      strokeWidth={strokeWidth}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      {...props}
    />
  )
}

// Pre-configured icon components for common use cases
export const IconButton: React.FC<IconProps & { variant?: 'default' | 'ghost' | 'outline' }> = ({
  variant = 'default',
  className = '',
  ...iconProps
}) => {
  const variantClasses = {
    default: 'bg-card-500 hover:bg-card-400 text-white',
    ghost: 'hover:bg-card-600 text-white',
    outline: 'border border-card-300 hover:bg-card-600 text-white',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
        variantClasses[variant],
        className
      )}
    >
      <Icon {...iconProps} />
    </div>
  )
}

// Export commonly used icons for convenience
export const Icons = {
  // Navigation
  ArrowLeft: (props: Omit<IconProps, 'name'>) => <Icon name="ArrowLeft" {...props} />,
  ArrowRight: (props: Omit<IconProps, 'name'>) => <Icon name="ArrowRight" {...props} />,
  ArrowUp: (props: Omit<IconProps, 'name'>) => <Icon name="ArrowUp" {...props} />,
  ArrowDown: (props: Omit<IconProps, 'name'>) => <Icon name="ArrowDown" {...props} />,
  ChevronLeft: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronLeft" {...props} />,
  ChevronRight: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronRight" {...props} />,
  ChevronUp: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronUp" {...props} />,
  ChevronDown: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronDown" {...props} />,
  
  // Actions
  Plus: (props: Omit<IconProps, 'name'>) => <Icon name="Plus" {...props} />,
  Minus: (props: Omit<IconProps, 'name'>) => <Icon name="Minus" {...props} />,
  X: (props: Omit<IconProps, 'name'>) => <Icon name="X" {...props} />,
  Check: (props: Omit<IconProps, 'name'>) => <Icon name="Check" {...props} />,
  Edit: (props: Omit<IconProps, 'name'>) => <Icon name="Edit" {...props} />,
  Trash: (props: Omit<IconProps, 'name'>) => <Icon name="Trash" {...props} />,
  Save: (props: Omit<IconProps, 'name'>) => <Icon name="Save" {...props} />,
  
  // UI Elements
  Search: (props: Omit<IconProps, 'name'>) => <Icon name="Search" {...props} />,
  Filter: (props: Omit<IconProps, 'name'>) => <Icon name="Filter" {...props} />,
  Settings: (props: Omit<IconProps, 'name'>) => <Icon name="Settings" {...props} />,
  Menu: (props: Omit<IconProps, 'name'>) => <Icon name="Menu" {...props} />,
  MoreHorizontal: (props: Omit<IconProps, 'name'>) => <Icon name="MoreHorizontal" {...props} />,
  MoreVertical: (props: Omit<IconProps, 'name'>) => <Icon name="MoreVertical" {...props} />,
  
  // Status
  Info: (props: Omit<IconProps, 'name'>) => <Icon name="Info" {...props} />,
  AlertCircle: (props: Omit<IconProps, 'name'>) => <Icon name="AlertCircle" {...props} />,
  CheckCircle: (props: Omit<IconProps, 'name'>) => <Icon name="CheckCircle" {...props} />,
  XCircle: (props: Omit<IconProps, 'name'>) => <Icon name="XCircle" {...props} />,
  
  // Media
  Play: (props: Omit<IconProps, 'name'>) => <Icon name="Play" {...props} />,
  Pause: (props: Omit<IconProps, 'name'>) => <Icon name="Pause" {...props} />,
  Volume: (props: Omit<IconProps, 'name'>) => <Icon name="Volume" {...props} />,
  VolumeX: (props: Omit<IconProps, 'name'>) => <Icon name="VolumeX" {...props} />,
  
  // Social
  Heart: (props: Omit<IconProps, 'name'>) => <Icon name="Heart" {...props} />,
  Share: (props: Omit<IconProps, 'name'>) => <Icon name="Share" {...props} />,
  MessageCircle: (props: Omit<IconProps, 'name'>) => <Icon name="MessageCircle" {...props} />,
  
  // Rewards
  Coins: (props: Omit<IconProps, 'name'>) => <Icon name="CircleDollarSign" {...props} />,
  
  // Files
  File: (props: Omit<IconProps, 'name'>) => <Icon name="File" {...props} />,
  Folder: (props: Omit<IconProps, 'name'>) => <Icon name="Folder" {...props} />,
  Download: (props: Omit<IconProps, 'name'>) => <Icon name="Download" {...props} />,
  Upload: (props: Omit<IconProps, 'name'>) => <Icon name="Upload" {...props} />,
  
  // Time
  Clock: (props: Omit<IconProps, 'name'>) => <Icon name="Clock" {...props} />,
  Calendar: (props: Omit<IconProps, 'name'>) => <Icon name="Calendar" {...props} />,
  
  // Communication
  Mail: (props: Omit<IconProps, 'name'>) => <Icon name="Mail" {...props} />,
  Phone: (props: Omit<IconProps, 'name'>) => <Icon name="Phone" {...props} />,
  MessageSquare: (props: Omit<IconProps, 'name'>) => <Icon name="MessageSquare" {...props} />,
  
  // Security
  Lock: (props: Omit<IconProps, 'name'>) => <Icon name="Lock" {...props} />,
  Unlock: (props: Omit<IconProps, 'name'>) => <Icon name="Unlock" {...props} />,
  Eye: (props: Omit<IconProps, 'name'>) => <Icon name="Eye" {...props} />,
  EyeOff: (props: Omit<IconProps, 'name'>) => <Icon name="EyeOff" {...props} />,
  
  // Navigation
  Home: (props: Omit<IconProps, 'name'>) => <Icon name="Home" {...props} />,
  User: (props: Omit<IconProps, 'name'>) => <Icon name="User" {...props} />,
  Users: (props: Omit<IconProps, 'name'>) => <Icon name="Users" {...props} />,
  Bell: (props: Omit<IconProps, 'name'>) => <Icon name="Bell" {...props} />,
  
  // Analytics
  Activity: (props: Omit<IconProps, 'name'>) => <Icon name="Activity" {...props} />,
  BarChart: (props: Omit<IconProps, 'name'>) => <Icon name="BarChart" {...props} />,
  
  // Goals
  Target: (props: Omit<IconProps, 'name'>) => <Icon name="Target" {...props} />,
}

export default Icon

