/**
 * Query keys for community-related queries
 * Centralized to ensure consistency across the app
 */
export const communityQueryKeys = {
  all: ['communities'] as const,
  lists: () => [...communityQueryKeys.all, 'list'] as const,
  list: (page?: number, limit?: number, isPublic?: boolean, category?: string) =>
    [...communityQueryKeys.lists(), { page, limit, isPublic, category }] as const,
  my: (page?: number, limit?: number) =>
    [...communityQueryKeys.all, 'my', { page, limit }] as const,
  details: () => [...communityQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...communityQueryKeys.details(), id] as const,
  members: (communityId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.detail(communityId), 'members', { page, limit }] as const,
  templates: (communityId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.detail(communityId), 'templates', { page, limit }] as const,
  template: (templateId: string) =>
    [...communityQueryKeys.all, 'template', templateId] as const,
  templateParticipants: (templateId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.template(templateId), 'participants', { page, limit }] as const,
  activity: (communityId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.detail(communityId), 'activity', { page, limit }] as const,
  comments: (activityId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.all, 'activity', activityId, 'comments', { page, limit }] as const,
  stats: (communityId: string) =>
    [...communityQueryKeys.detail(communityId), 'stats'] as const,
}
