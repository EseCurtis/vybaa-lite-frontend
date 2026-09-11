import { http } from '@/shared/api/http'
import type {
  Goal,
  GoalRewardReleasePolicy,
  GoalSchedule,
  GoalTarget,
} from '@/shared/api/goal.api'

const API_V1 = '/api/v1'

// ==================== Types ====================

export interface Community {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPublic: boolean
  category: string | null
  ownerId: string
  owner: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
  createdAt: string
  updatedAt: string
  discoveryReason?: string
  discoveryScore?: number
  isMember?: boolean
  joinedAt?: string | null
  userRole?: 'OWNER' | 'MOD' | 'MEMBER' | null
  _count?: {
    members: number
    templates: number
    goals: number
  }
}

export interface CommunityMember {
  id: string
  communityId: string
  userId: string
  role: 'OWNER' | 'MOD' | 'MEMBER'
  joinedAt: string
  totalRewards?: number // Total earned rewards (points)
  user: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
}

export interface GoalTemplate {
  id: string
  communityId: string
  goalText: string // Aligned with Goal model
  targetDays: number
  reminderTime: string | null // Format: "HH:MM" (24-hour format)
  reminderTimes?: string[]
  modelVersion?: number
  scheduleType?: GoalSchedule['type']
  weekdays?: number[]
  targetType?: GoalTarget['type']
  targetValue?: number
  unit?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  milestones?: TemplateMilestone[]
  creator: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
  _count?: {
    startedGoals: number
  }
}

export type MilestoneTriggerType = 'DAY' | 'PERCENTAGE' | 'SEQUENCE'

export interface TemplateMilestone {
  id: string
  templateId: string
  name: string
  description?: string | null
  triggerType: MilestoneTriggerType
  triggerValue: number
  points: number
  sequenceBonusPoints: number
  sequenceStartDay: number | null
  sequenceEndDay: number | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface CommunityActivity {
  id: string
  communityId: string
  userId: string
  type:
    | 'GOAL_STARTED'
    | 'GOAL_CHECK_IN'
    | 'GOAL_COMPLETED'
    | 'GOAL_STREAK_RESET'
    | 'GOAL_DELETED'
    | 'MEMBER_LEFT'
    | 'MILESTONE_REACHED'
    | 'ACHIEVEMENT_EARNED'
    | 'TEMPLATE_CREATED'
  goalId: string | null
  metadata: string | null
  createdAt: string
  hourBucket?: string
  user: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
  hasUserReacted?: boolean
  _count?: {
    reactions: number
    comments: number
  }
}

export interface ActivityComment {
  id: string
  activityId: string
  userId: string
  text: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
}

export interface CommunityStats {
  memberCount: number
  templateCount: number
  activeGoalCount: number
  recentActivityCount: number
}

export interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface CreateCommunityRequest {
  name: string
  description?: string
  coverImage?: string
  isPublic?: boolean
  category?: string
}

export interface UpdateCommunityRequest {
  name?: string
  description?: string | null
  coverImage?: string | null
  isPublic?: boolean
  category?: string | null
}

export interface CreateTemplateRequest {
  goalText: string // Aligned with goal creation
  targetDays: number
  reminderTime?: string // Format: "HH:MM" (24-hour format)
  reminderTimes?: string[]
  schedule?: GoalSchedule
  target?: GoalTarget
  milestones?: {
    id?: string
    name: string
    description?: string
    triggerType: MilestoneTriggerType
    triggerValue: number
    points: number
    sequenceBonusPoints?: number
    sequenceStartDay?: number
    sequenceEndDay?: number
    order?: number
  }[]
}

export interface UpdateTemplateRequest {
  goalText?: string
  targetDays?: number
  reminderTime?: string | null
  reminderTimes?: string[]
  schedule?: GoalSchedule
  target?: GoalTarget
  milestones?: {
    id?: string
    name: string
    description?: string | null
    triggerType: MilestoneTriggerType
    triggerValue: number
    points: number
    sequenceBonusPoints?: number
    sequenceStartDay?: number
    sequenceEndDay?: number
    order?: number
  }[]
}

export interface StartGoalFromTemplateRequest {
  reminderTimes?: string[]
  rewardReleasePolicy?: GoalRewardReleasePolicy
  schedule?: GoalSchedule
}

export interface UpdateMemberRoleRequest {
  userId: string
  role: 'OWNER' | 'MOD' | 'MEMBER'
}

export interface CreateCommentRequest {
  text: string
}

export type ModerationReportTarget = 'activity' | 'comment' | 'user'

export interface CreateModerationReportRequest {
  targetType: ModerationReportTarget
  targetId: string
  reason: 'harassment' | 'hate' | 'sexual' | 'violence' | 'spam' | 'other'
  details?: string
}

export interface BlockUserRequest {
  evidence?: CreateModerationReportRequest
  userId: string
}

export interface CommunitiesListResponse {
  msg: string
  data: Community[]
  pagination: PaginationMeta
}

export interface CommunityResponse {
  msg: string
  data: Community
}

export interface TemplatesListResponse {
  msg: string
  data: GoalTemplate[]
  pagination: PaginationMeta
}

export interface TemplateResponse {
  msg: string
  data: GoalTemplate
}

export interface MembersListResponse {
  msg: string
  data: CommunityMember[]
  pagination: PaginationMeta
}

export interface ActivityFeedResponse {
  msg: string
  data: CommunityActivity[]
  pagination: PaginationMeta
}

export interface CommentsListResponse {
  msg: string
  data: ActivityComment[]
  pagination: PaginationMeta
}

export interface CommentResponse {
  msg: string
  data: ActivityComment
}

export interface CommunityStatsResponse {
  msg: string
  data: CommunityStats
}

export interface TemplateParticipant {
  goalId: string
  userId: string
  user: {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
  currentDay: number
  targetDays: number
  progress: number
  lastCheckInDate: string | null
  startedAt: string
  isCompleted: boolean
}

export interface TemplateParticipantsResponse {
  msg: string
  data: TemplateParticipant[]
  pagination: PaginationMeta
}

// ==================== Invite Types ====================

export interface CreateInviteRequest {
  inviteeUsername?: string
  inviteeEmail?: string
  maxUses?: number
  expiresInDays?: number
}

export interface CommunityInvite {
  id: string
  code: string
  link: string
  communityId: string
  communityName?: string
  invitedBy?: {
    id: string
    username: string | null
    firstName: string | null
  }
  invitee?: {
    id: string
    username: string | null
    firstName: string | null
  } | null
  inviteeUsername?: string | null
  inviteeEmail?: string | null
  maxUses: number
  uses: number
  expiresAt: string | null
  createdAt: string
  isExpired?: boolean
  isMaxed?: boolean
}

export interface InviteResponse {
  msg: string
  data: CommunityInvite
}

export interface InvitePreviewResponse {
  msg: string
  data: {
    id: string
    code: string
    community: {
      id: string
      name: string
      description: string | null
      coverImage: string | null
      _count: { members: number }
    }
    invitedBy: {
      id: string
      username: string | null
      firstName: string | null
      lastName: string | null
      avatarUrl: string | null
    }
    expiresAt: string | null
    createdAt: string
  }
}

// ==================== API Class ====================

class CommunityAPI {
  // ==================== Communities ====================

  async createCommunity(
    data: CreateCommunityRequest,
  ): Promise<CommunityResponse> {
    const { data: res } = await http.post<CommunityResponse>(
      `${API_V1}/communities`,
      data,
    )
    return res
  }

  async getCommunities(
    page: number = 1,
    limit: number = 10,
    isPublic?: boolean,
    category?: string,
  ): Promise<CommunitiesListResponse> {
    const params: any = { page, limit }
    if (isPublic !== undefined) params.isPublic = isPublic
    if (category) params.category = category
    const { data: res } = await http.get<CommunitiesListResponse>(
      `${API_V1}/communities`,
      { params },
    )
    return res
  }

  async getMyCommunities(
    page: number = 1,
    limit: number = 10,
  ): Promise<CommunitiesListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<CommunitiesListResponse>(
      `${API_V1}/communities/my`,
      { params },
    )
    return res
  }

  async getCommunityById(communityId: string): Promise<CommunityResponse> {
    const { data: res } = await http.get<CommunityResponse>(
      `${API_V1}/communities/${communityId}`,
    )
    return res
  }

  async updateCommunity(
    communityId: string,
    data: UpdateCommunityRequest,
  ): Promise<CommunityResponse> {
    const { data: res } = await http.put<CommunityResponse>(
      `${API_V1}/communities/${communityId}`,
      data,
    )
    return res
  }

  async deleteCommunity(communityId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/communities/${communityId}`,
    )
    return res
  }

  // ==================== Membership ====================

  async joinCommunity(
    communityId: string,
  ): Promise<{ msg: string; data: CommunityMember }> {
    const { data: res } = await http.post<{
      msg: string
      data: CommunityMember
    }>(`${API_V1}/communities/${communityId}/join`, { communityId })
    return res
  }

  async leaveCommunity(communityId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/communities/${communityId}/leave`,
    )
    return res
  }

  async getCommunityMembers(
    communityId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<MembersListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<MembersListResponse>(
      `${API_V1}/communities/${communityId}/members`,
      { params },
    )
    return res
  }

  async updateMemberRole(
    communityId: string,
    data: UpdateMemberRoleRequest,
  ): Promise<{ msg: string; data: CommunityMember }> {
    const { data: res } = await http.put<{
      msg: string
      data: CommunityMember
    }>(`${API_V1}/communities/${communityId}/members/role`, data)
    return res
  }

  // ==================== Templates ====================

  async createTemplate(
    communityId: string,
    data: CreateTemplateRequest,
  ): Promise<TemplateResponse> {
    const { data: res } = await http.post<TemplateResponse>(
      `${API_V1}/communities/${communityId}/templates`,
      data,
    )
    return res
  }

  async getTemplates(
    communityId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TemplatesListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<TemplatesListResponse>(
      `${API_V1}/communities/${communityId}/templates`,
      { params },
    )
    return res
  }

  async getTemplateById(templateId: string): Promise<TemplateResponse> {
    const { data: res } = await http.get<TemplateResponse>(
      `${API_V1}/communities/templates/${templateId}`,
    )
    return res
  }

  async updateTemplate(
    templateId: string,
    data: UpdateTemplateRequest,
  ): Promise<TemplateResponse> {
    const { data: res } = await http.put<TemplateResponse>(
      `${API_V1}/communities/templates/${templateId}`,
      data,
    )
    return res
  }

  async deleteTemplate(templateId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/communities/templates/${templateId}`,
    )
    return res
  }

  async startGoalFromTemplate(
    templateId: string,
    data?: StartGoalFromTemplateRequest,
  ): Promise<{ msg: string; data: Goal }> {
    const { data: res } = await http.post<{ msg: string; data: Goal }>(
      `${API_V1}/communities/templates/${templateId}/start`,
      data || {},
    )
    return res
  }

  async getTemplateParticipants(
    templateId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TemplateParticipantsResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<TemplateParticipantsResponse>(
      `${API_V1}/communities/templates/${templateId}/participants`,
      { params },
    )
    return res
  }

  // ==================== Activity ====================

  async getActivityFeed(
    communityId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ActivityFeedResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<ActivityFeedResponse>(
      `${API_V1}/communities/${communityId}/activity`,
      { params },
    )
    return res
  }

  async reactToActivity(
    activityId: string,
  ): Promise<{ msg: string; data: { reacted: boolean } }> {
    const { data: res } = await http.post<{
      msg: string
      data: { reacted: boolean }
    }>(`${API_V1}/communities/activity/${activityId}/react`, {})
    return res
  }

  async createComment(
    activityId: string,
    data: CreateCommentRequest,
  ): Promise<CommentResponse> {
    const { data: res } = await http.post<CommentResponse>(
      `${API_V1}/communities/activity/${activityId}/comments`,
      data,
    )
    return res
  }

  async getComments(
    activityId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CommentsListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<CommentsListResponse>(
      `${API_V1}/communities/activity/${activityId}/comments`,
      { params },
    )
    return res
  }

  async deleteComment(commentId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/communities/activity/comments/${commentId}`,
    )
    return res
  }

  async reportContent(
    data: CreateModerationReportRequest,
  ): Promise<{ msg: string; data: { reported: boolean } }> {
    const { data: res } = await http.post<{
      msg: string
      data: { reported: boolean }
    }>(`${API_V1}/moderation/reports`, data)
    return res
  }

  async blockUser(
    request: BlockUserRequest,
  ): Promise<{ msg: string; data: { blocked: boolean; userId: string } }> {
    const { data: res } = await http.post<{
      msg: string
      data: { blocked: boolean; userId: string }
    }>(
      `${API_V1}/moderation/blocks/${encodeURIComponent(request.userId)}`,
      request.evidence,
    )
    return res
  }

  async unblockUser(
    userId: string,
  ): Promise<{ msg: string; data: { blocked: boolean; userId: string } }> {
    const { data: res } = await http.delete<{
      msg: string
      data: { blocked: boolean; userId: string }
    }>(`${API_V1}/moderation/blocks/${encodeURIComponent(userId)}`)
    return res
  }

  // ==================== Stats ====================

  async getCommunityStats(
    communityId: string,
  ): Promise<CommunityStatsResponse> {
    const { data: res } = await http.get<CommunityStatsResponse>(
      `${API_V1}/communities/${communityId}/stats`,
    )
    return res
  }

  // ==================== Invites ====================

  async createInvite(
    communityId: string,
    data?: CreateInviteRequest,
  ): Promise<InviteResponse> {
    const { data: res } = await http.post<InviteResponse>(
      `${API_V1}/communities/${communityId}/invites`,
      data || {},
    )
    return res
  }

  async getInviteByCode(code: string): Promise<InvitePreviewResponse> {
    const { data: res } = await http.get<InvitePreviewResponse>(
      `${API_V1}/communities/invites/${code.toUpperCase()}`,
    )
    return res
  }

  async joinByInviteCode(
    code: string,
  ): Promise<{ msg: string; data: { community: Community | null } }> {
    const { data: res } = await http.post<{
      msg: string
      data: { community: Community | null }
    }>(`${API_V1}/communities/invites/${code.toUpperCase()}/join`, {})
    return res
  }

  async getCommunityInvites(
    communityId: string,
  ): Promise<{ msg: string; data: CommunityInvite[] }> {
    const { data: res } = await http.get<{
      msg: string
      data: CommunityInvite[]
    }>(`${API_V1}/communities/${communityId}/invites`)
    return res
  }

  async revokeInvite(inviteId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/communities/invites/${inviteId}`,
    )
    return res
  }
}

export const communityAPI = new CommunityAPI()
