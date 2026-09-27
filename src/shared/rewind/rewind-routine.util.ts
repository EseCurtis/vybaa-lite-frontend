const REWIND_MINIMUM_GAP_MINUTES = 8 * 60

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

export function getCustomRewindTimeError(
  times: [string, string],
): string | null {
  const normalizedTimes = [...times].sort()
  const first = timeToMinutes(normalizedTimes[0])
  const second = timeToMinutes(normalizedTimes[1])
  if (first === null || second === null || first === second) {
    return 'Choose two different times.'
  }

  const forwardGap = second - first
  const overnightGap = 24 * 60 - forwardGap
  if (
    forwardGap < REWIND_MINIMUM_GAP_MINUTES ||
    overnightGap < REWIND_MINIMUM_GAP_MINUTES
  ) {
    return 'Keep at least eight hours between both Rewinds.'
  }
  return null
}
