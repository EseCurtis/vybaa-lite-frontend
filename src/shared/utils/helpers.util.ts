/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PaginateQuery } from '../types/base.types'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind class merging
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('text-red-500', isError && 'text-red-600') // conditionally applies text-red-600
 * cn('base-class', { 'active-class': isActive }) // object syntax for conditions
 */
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates a string to a specified maximum length, preserving whole words
 * and adding an ellipsis (...) when truncated.
 * @param text - The input string to truncate
 * @param maxLength - Maximum length including ellipsis (default: 30)
 * @param ellipsis - Custom ellipsis string (default: '...')
 * @returns The truncated string
 */
export function smartTruncate(
  text: string,
  maxLength: number = 30,
  ellipsis: string = '...',
): string {
  // Return original text if it's shorter than maxLength or invalid input
  if (!text || typeof text !== 'string' || text.length <= maxLength) {
    return text
  }

  // Ensure maxLength is at least longer than ellipsis
  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, maxLength)
  }

  // Split text into words
  const words = text.split(/\s+/)
  let truncated = ''
  const availableLength = maxLength - ellipsis.length

  // Build truncated string word by word
  for (const word of words) {
    // Check if adding the next word exceeds the available length
    if ((truncated + (truncated ? ' ' : '') + word).length > availableLength) {
      break
    }
    truncated += (truncated ? ' ' : '') + word
  }

  // If no words fit or text wasn't truncated, adjust accordingly
  if (!truncated) {
    return text.slice(0, availableLength) + ellipsis
  }

  return truncated + ellipsis
}

// for infinite query pages  to flatList data
export function normalizePages<T>(pages?: Array<PaginateQuery<T>>): Array<T> {
  return pages
    ? pages.reduce(
        (prev: Array<T>, current) => [...prev, ...(current?.data || [])],
        [],
      )
    : []
}

// Simple HSL-based seeded color generator
export function seededColor(...seeds: string[]) {
  // Combine all arguments into one string to use as seed
  const seedStr = seeds.join('|')

  // Simple but decent hash function (murmur-like inspired)
  let h = 0
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i)
    h = (h * 31 + char) | 0 // | 0 → force 32-bit int
  }

  // Convert to unsigned 32-bit value and map to hue (0–360)
  const hue = Math.abs(h) % 360

  // Fixed saturation & lightness → vibrant but not blinding colors
  const saturation = 85 // %
  const lightness = 65 // %

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Returns a readable foreground for a generated background color.
 * Uses WCAG relative luminance so seeded colors can change without making
 * assumptions about whether black or white text will contrast best.
 */
export function contrastingTextColor(
  backgroundColor: string,
): '#000000' | '#FFFFFF' {
  const hsl = backgroundColor.match(
    /^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%/i,
  )
  if (!hsl) return '#FFFFFF'

  const hue = ((Number(hsl[1]) % 360) + 360) % 360
  const saturation = Number(hsl[2]) / 100
  const lightness = Number(hsl[3]) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const match =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x]
  const m = lightness - chroma / 2
  const rgb = match.map((channel) => channel + m)
  const luminance = rgb.reduce((total, channel, index) => {
    const linear =
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    return total + linear * ([0.2126, 0.7152, 0.0722][index] ?? 0)
  }, 0)
  return luminance > 0.179 ? '#000000' : '#FFFFFF'
}

interface HslColor {
  h: number
  s: number
  l: number
  a?: number
}

interface ColorAdjustments {
  hue?: number
  saturation?: number
  lightness?: number
  alpha?: number
}

/**
 * Adjusts an HSL color string (or hex) and returns a new HSL(A) string.
 *
 * @param color - Input color: "hsl(120, 70%, 50%)", "hsla(120, 70%, 50%, 0.8)", "#3f6", "#33ff66"
 * @param adjustments - Relative changes to apply
 * @returns New `hsl(...)` or `hsla(...)` string
 */
export function adjustColor(
  color: string,
  adjustments: ColorAdjustments = {},
): string {
  // Parse input to HSL object
  let hsl: HslColor = parseToHsl(color)

  // Apply adjustments (all relative)
  if (adjustments.lightness !== undefined) {
    hsl.l = Math.max(0, Math.min(100, hsl.l + adjustments.lightness))
  }

  if (adjustments.saturation !== undefined) {
    hsl.s = Math.max(0, Math.min(100, hsl.s + adjustments.saturation))
  }

  if (adjustments.hue !== undefined) {
    hsl.h = (hsl.h + adjustments.hue + 360) % 360
  }

  if (adjustments.alpha !== undefined) {
    const currentAlpha = hsl.a ?? 1
    hsl.a = Math.max(0, Math.min(1, currentAlpha + adjustments.alpha))
  }

  // Build output string
  const h = Math.round(hsl.h)
  const s = Math.round(hsl.s)
  const l = Math.round(hsl.l)

  if (hsl.a !== undefined && hsl.a < 1) {
    const a = Number(hsl.a.toFixed(2))
    return `hsla(${h}, ${s}%, ${l}%, ${a})`
  }

  return `hsl(${h}, ${s}%, ${l}%)`
}

// ────────────────────────────────────────────────

/**
 * Parses a color string (hsl/hsla/hex) into an HSL object
 */
function parseToHsl(input: string): HslColor {
  const cleaned = (input || '').trim().toLowerCase()

  // 1. Try to parse HSL(A) format
  const hslMatch = cleaned.match(
    /hsla?\(\s*([\d.]+)[°, ]?\s*([\d.]+)%?[ ,]\s*([\d.]+)%?(?:\s*[,/ ]\s*([\d.]+))?\s*\)/,
  )

  if (hslMatch) {
    return {
      h: parseFloat(hslMatch[1]),
      s: parseFloat(hslMatch[2]),
      l: parseFloat(hslMatch[3]),
      a: hslMatch[4] ? parseFloat(hslMatch[4]) : undefined,
    }
  }

  // 2. Try to parse hex
  let hex = cleaned.replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_, r, g, b) => r + r + g + g + b + b,
  )

  const rgbMatch = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)

  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 16) / 255
    const g = parseInt(rgbMatch[2], 16) / 255
    const b = parseInt(rgbMatch[3], 16) / 255
    return rgbToHsl(r, g, b)
  }

  // Fallback: neutral gray
  return { h: 0, s: 0, l: 50 }
}

/**
 * Converts RGB (0–1 range) to HSL (h:0–360, s:0–100, l:0–100)
 */
function rgbToHsl(r: number, g: number, b: number): HslColor {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s: number
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h *= 60
  }

  return {
    h,
    s: s * 100,
    l: l * 100,
  }
}

/**
 * Returns a deterministic random number between min and max.
 *
 * @param min Lower bound
 * @param max Upper bound
 * @param seed Seed used to generate the random value
 * @param integerOnly When true, returns a whole number
 */
export function randomInRange(
  min: number,
  max: number,
  seed: number,
  integerOnly = false,
): number {
  if (min > max) [min, max] = [max, min]

  let value = seed >>> 0

  value += 0x6d2b79f5
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

  const random = ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296

  if (integerOnly) {
    return (
      Math.floor(random * (Math.floor(max) - Math.ceil(min) + 1)) +
      Math.ceil(min)
    )
  }

  return random * (max - min) + min
}
