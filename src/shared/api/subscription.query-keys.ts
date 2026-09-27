export const subscriptionQueryKeys = {
  all: ['subscription'] as const,
  config: () => [...subscriptionQueryKeys.all, 'config'] as const,
  status: () => [...subscriptionQueryKeys.all, 'status'] as const,
}
