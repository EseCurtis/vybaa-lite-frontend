import { http } from '@/shared/api/http'

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
  isMember?: boolean
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
  createdBy: string
  createdAt: string
  updatedAt: string
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

export interface CommunityActivity {
  id: string
  communityId: string
  userId: string
  type: 'GOAL_STARTED' | 'GOAL_CHECK_IN' | 'GOAL_COMPLETED' | 'ACHIEVEMENT_EARNED' | 'TEMPLATE_CREATED'
  goalId: string | null
  metadata: string | null
  createdAt: string
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
}

export interface UpdateTemplateRequest {
  goalText?: string
  targetDays?: number
  reminderTime?: string | null
}

export interface StartGoalFromTemplateRequest {
  reminderTime?: string
}

export interface UpdateMemberRoleRequest {
  userId: string
  role: 'OWNER' | 'MOD' | 'MEMBER'
}

export interface CreateCommentRequest {
  text: string
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

// ==================== API Class ====================

class CommunityAPI {
  // ==================== Communities ====================
  
  async createCommunity(data: CreateCommunityRequest): Promise<CommunityResponse> {
    const { data: res } = await http.post<CommunityResponse>(`${API_V1}/communities`, data)
    return res
  }

  async getCommunities(page: number = 1, limit: number = 10, isPublic?: boolean, category?: string): Promise<CommunitiesListResponse> {
    const params: any = { page, limit }
    if (isPublic !== undefined) params.isPublic = isPublic
    if (category) params.category = category
    const { data: res } = await http.get<CommunitiesListResponse>(`${API_V1}/communities`, { params })
    return res
  }

  async getMyCommunities(page: number = 1, limit: number = 10): Promise<CommunitiesListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<CommunitiesListResponse>(`${API_V1}/communities/my`, { params })
    return res
  }

  async getCommunityById(communityId: string): Promise<CommunityResponse> {
    const { data: res } = await http.get<CommunityResponse>(`${API_V1}/communities/${communityId}`)
    return res
  }

  async updateCommunity(communityId: string, data: UpdateCommunityRequest): Promise<CommunityResponse> {
    const { data: res } = await http.put<CommunityResponse>(`${API_V1}/communities/${communityId}`, data)
    return res
  }

  async deleteCommunity(communityId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/communities/${communityId}`)
    return res
  }

  // ==================== Membership ====================

  async joinCommunity(communityId: string): Promise<{ msg: string; data: CommunityMember }> {
    const { data: res } = await http.post<{ msg: string; data: CommunityMember }>(`${API_V1}/communities/${communityId}/join`, { communityId })
    return res
  }

  async leaveCommunity(communityId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/communities/${communityId}/leave`)
    return res
  }

  async getCommunityMembers(communityId: string, page: number = 1, limit: number = 20): Promise<MembersListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<MembersListResponse>(`${API_V1}/communities/${communityId}/members`, { params })
    return res
  }

  async updateMemberRole(communityId: string, data: UpdateMemberRoleRequest): Promise<{ msg: string; data: CommunityMember }> {
    const { data: res } = await http.put<{ msg: string; data: CommunityMember }>(`${API_V1}/communities/${communityId}/members/role`, data)
    return res
  }

  // ==================== Templates ====================

  async createTemplate(communityId: string, data: CreateTemplateRequest): Promise<TemplateResponse> {
    const { data: res } = await http.post<TemplateResponse>(`${API_V1}/communities/${communityId}/templates`, data)
    return res
  }

  async getTemplates(communityId: string, page: number = 1, limit: number = 20): Promise<TemplatesListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<TemplatesListResponse>(`${API_V1}/communities/${communityId}/templates`, { params })
    return res
  }

  async getTemplateById(templateId: string): Promise<TemplateResponse> {
    const { data: res } = await http.get<TemplateResponse>(`${API_V1}/communities/templates/${templateId}`)
    return res
  }

  async updateTemplate(templateId: string, data: UpdateTemplateRequest): Promise<TemplateResponse> {
    const { data: res } = await http.put<TemplateResponse>(`${API_V1}/communities/templates/${templateId}`, data)
    return res
  }

  async deleteTemplate(templateId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/communities/templates/${templateId}`)
    return res
  }

  async startGoalFromTemplate(templateId: string, data?: StartGoalFromTemplateRequest): Promise<{ msg: string; data: any }> {
    const { data: res } = await http.post<{ msg: string; data: any }>(`${API_V1}/communities/templates/${templateId}/start`, data || {})
    return res
  }

  async getTemplateParticipants(templateId: string, page: number = 1, limit: number = 20): Promise<TemplateParticipantsResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<TemplateParticipantsResponse>(`${API_V1}/communities/templates/${templateId}/participants`, { params })
    return res
  }

  // ==================== Activity ====================

  async getActivityFeed(communityId: string, page: number = 1, limit: number = 20): Promise<ActivityFeedResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<ActivityFeedResponse>(`${API_V1}/communities/${communityId}/activity`, { params })
    return res
  }

  async reactToActivity(activityId: string): Promise<{ msg: string; data: { reacted: boolean } }> {
    const { data: res } = await http.post<{ msg: string; data: { reacted: boolean } }>(`${API_V1}/communities/activity/${activityId}/react`, {})
    return res
  }

  async createComment(activityId: string, data: CreateCommentRequest): Promise<CommentResponse> {
    const { data: res } = await http.post<CommentResponse>(`${API_V1}/communities/activity/${activityId}/comments`, data)
    return res
  }

  async getComments(activityId: string, page: number = 1, limit: number = 20): Promise<CommentsListResponse> {
    const params = { page, limit }
    const { data: res } = await http.get<CommentsListResponse>(`${API_V1}/communities/activity/${activityId}/comments`, { params })
    return res
  }

  async deleteComment(commentId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/communities/activity/comments/${commentId}`)
    return res
  }

  // ==================== Stats ====================

  async getCommunityStats(communityId: string): Promise<CommunityStatsResponse> {
    const { data: res } = await http.get<CommunityStatsResponse>(`${API_V1}/communities/${communityId}/stats`)
    return res
  }
}

export const communityAPI = new CommunityAPI()
