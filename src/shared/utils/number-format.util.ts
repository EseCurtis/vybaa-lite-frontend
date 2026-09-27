const compactNumberFormatter = new Intl.NumberFormat('en', {
  compactDisplay: 'short',
  maximumFractionDigits: 1,
  notation: 'compact',
})

export function formatCompactNumber(value: number | null | undefined): string {
  const normalizedValue = value ?? 0

  if (normalizedValue < 1000) {
    return String(normalizedValue)
  }

  return compactNumberFormatter.format(normalizedValue).toLowerCase()
}
