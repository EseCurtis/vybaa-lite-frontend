/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PaginateQuery } from '../types/base.types';

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
  ellipsis: string = '...'
): string {
  // Return original text if it's shorter than maxLength or invalid input
  if (!text || typeof text !== 'string' || text.length <= maxLength) {
    return text;
  }

  // Ensure maxLength is at least longer than ellipsis
  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, maxLength);
  }

  // Split text into words
  const words = text.split(/\s+/);
  let truncated = '';
  const availableLength = maxLength - ellipsis.length;

  // Build truncated string word by word
  for (const word of words) {
    // Check if adding the next word exceeds the available length
    if ((truncated + (truncated ? ' ' : '') + word).length > availableLength) {
      break;
    }
    truncated += (truncated ? ' ' : '') + word;
  }

  // If no words fit or text wasn't truncated, adjust accordingly
  if (!truncated) {
    return text.slice(0, availableLength) + ellipsis;
  }

  return truncated + ellipsis;
}

// for infinite query pages  to flatList data
export function normalizePages<T>(pages?: Array<PaginateQuery<T>>): Array<T> {
  return pages
    ? pages.reduce(
        (prev: Array<T>, current) => [...prev, ...(current?.data || [])],
        []
      )
    : [];
}