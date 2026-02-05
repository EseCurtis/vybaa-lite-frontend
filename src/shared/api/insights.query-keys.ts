/**
 * Query keys for insights-related queries
 * Centralized to ensure consistency across the app
 */
export const insightsQueryKeys = {
  all: ['insights'] as const,
  summary: () => [...insightsQueryKeys.all, 'summary'] as const,
}
