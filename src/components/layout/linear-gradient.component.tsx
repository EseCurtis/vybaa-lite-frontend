import { cn } from '@/shared/utils/helpers.util'
import type { HTMLAttributes } from 'react'

interface ILinearGradient extends HTMLAttributes<HTMLSpanElement> {
  locations?: [number, number, ...number[]]
  colors: [string, string, ...string[]]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

export const LinearGradient: React.FC<ILinearGradient> = ({ 
  colors, 
  locations, 
  start = { x: 0, y: 0 }, 
  end = { x: 0, y: 1 },
  className,
  style,
  ...rest 
}) => {
  // Set default locations if not provided
  const gradientLocations = locations || colors.map((_, index) => index / (colors.length - 1))

  // Calculate angle from start and end coordinates
  // start = {x: 0, y: 0} and end = {x: 0, y: 1} creates a vertical gradient (top to bottom)
  // start = {x: 0, y: 0} and end = {x: 1, y: 0} creates a horizontal gradient (left to right)
  const calculateAngle = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    // Convert to degrees and adjust for CSS gradient coordinate system
    // CSS gradients use 0deg = top, 90deg = right, 180deg = bottom, 270deg = left
    const angleRad = Math.atan2(dy, dx)
    const angleDeg = (angleRad * 180) / Math.PI
    
    // Adjust angle to match CSS linear-gradient convention
    // In CSS: 0deg = to top, 90deg = to right, 180deg = to bottom, 270deg = to left
    return 90 + angleDeg
  }

  const angle = calculateAngle(start, end)

  // Create color stops with locations
  const colorStops = colors.map((color, index) => {
    const location = gradientLocations[index] ?? index / (colors.length - 1)
    return `${color} ${(location * 100).toFixed(2)}%`
  }).join(', ')

  return (
    <div
      {...rest}
      className={cn(className)}
      style={{
        ...style,
        background: `linear-gradient(${angle}deg, ${colorStops})`,
      }}
    />
  )
}
