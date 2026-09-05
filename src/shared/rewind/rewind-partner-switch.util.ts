export function canChangeRewindPartner(
  nextAvailableAt: string | undefined,
  now: Date = new Date(),
): boolean {
  if (!nextAvailableAt) return true

  const nextAvailableTime = Date.parse(nextAvailableAt)
  return (
    Number.isFinite(nextAvailableTime) && nextAvailableTime <= now.getTime()
  )
}
