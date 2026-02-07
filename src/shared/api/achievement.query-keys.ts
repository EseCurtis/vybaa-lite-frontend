export const achievementQueryKeys = {
  all: ['achievements'] as const,
  list: () => [...achievementQueryKeys.all, 'list'] as const,
  stats: () => [...achievementQueryKeys.all, 'stats'] as const,
  definitions: () => [...achievementQueryKeys.all, 'definitions'] as const,
}
