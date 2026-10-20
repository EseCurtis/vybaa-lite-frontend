const BADGE_MILESTONES: Readonly<Record<string, readonly number[]>> = {
  streak_milestone: [3, 7, 14, 21, 30, 50, 100, 365],
  total_goals: [3, 5, 10],
  total_checkins: [50, 100, 200, 500],
  perfect_week: [1],
  comeback: [1],
  early_bird: [1],
  night_owl: [1],
}

export function achievementBadgeAsset(
  type?: string,
  milestone?: number,
): string {
  const known =
    type !== undefined &&
    milestone !== undefined &&
    BADGE_MILESTONES[type]?.includes(milestone)
  return `/assets/achievements/v1/${known ? `${type}-${milestone}` : 'signature'}.webp`
}
