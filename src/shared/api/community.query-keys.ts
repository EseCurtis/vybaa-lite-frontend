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
  membersRoot: (communityId: string) =>
    [...communityQueryKeys.detail(communityId), 'members'] as const,
  members: (communityId: string, limit?: number) =>
    [...communityQueryKeys.membersRoot(communityId), { limit }] as const,
  templatesRoot: (communityId: string) =>
    [...communityQueryKeys.detail(communityId), 'templates'] as const,
  templates: (communityId: string, limit?: number) =>
    [...communityQueryKeys.templatesRoot(communityId), { limit }] as const,
  template: (templateId: string) =>
    [...communityQueryKeys.all, 'template', templateId] as const,
  templateParticipantsRoot: (templateId: string) =>
    [...communityQueryKeys.template(templateId), 'participants'] as const,
  templateParticipants: (templateId: string, limit?: number) =>
    [...communityQueryKeys.templateParticipantsRoot(templateId), { limit }] as const,
  activityRoot: (communityId: string) =>
    [...communityQueryKeys.detail(communityId), 'activity'] as const,
  activity: (communityId: string, limit?: number) =>
    [...communityQueryKeys.activityRoot(communityId), { limit }] as const,
  commentsRoot: (activityId: string) =>
    [...communityQueryKeys.all, 'activity', activityId, 'comments'] as const,
  comments: (activityId: string, page?: number, limit?: number) =>
    [...communityQueryKeys.commentsRoot(activityId), { page, limit }] as const,
  invitesRoot: () => [...communityQueryKeys.all, 'invites'] as const,
  invites: (communityId: string) =>
    [...communityQueryKeys.invitesRoot(), communityId] as const,
  invite: (code: string) =>
    [...communityQueryKeys.all, 'invite', code.toUpperCase()] as const,
  stats: (communityId: string) =>
    [...communityQueryKeys.detail(communityId), 'stats'] as const,
}
