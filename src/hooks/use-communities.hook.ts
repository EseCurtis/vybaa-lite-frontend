import { useToast } from '@/providers/toast.provider'
import {
  communityAPI,
  type CreateCommentRequest,
  type CreateCommunityRequest,
  type CreateTemplateRequest,
  type StartGoalFromTemplateRequest,
  type UpdateCommunityRequest,
  type UpdateMemberRoleRequest,
  type UpdateTemplateRequest,
} from '@/shared/api/community.api'
import { communityQueryKeys } from '@/shared/api/community.query-keys'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ==================== Communities ====================

export function useCommunities(page: number = 1, limit: number = 10, isPublic?: boolean, category?: string) {
  return useQuery({
    queryKey: communityQueryKeys.list(page, limit, isPublic, category),
    queryFn: async () => {
      const response = await communityAPI.getCommunities(page, limit, isPublic, category)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useMyCommunities(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: communityQueryKeys.my(page, limit),
    queryFn: async () => {
      const response = await communityAPI.getMyCommunities(page, limit)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCommunity(communityId: string) {
  return useQuery({
    queryKey: communityQueryKeys.detail(communityId),
    queryFn: async () => {
      const response = await communityAPI.getCommunityById(communityId)
      return response.data
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateCommunity() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (data: CreateCommunityRequest) => communityAPI.createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() })
      toast.success('Community created successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to create community'
      toast.error(message)
    },
  })
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: UpdateCommunityRequest }) =>
      communityAPI.updateCommunity(communityId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(variables.communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() })
      toast.success('Community updated successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to update community'
      toast.error(message)
    },
  })
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (communityId: string) => communityAPI.deleteCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() })
      toast.success('Community deleted successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to delete community'
      toast.error(message)
    },
  })
}

// ==================== Membership ====================

export function useJoinCommunity() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (communityId: string) => communityAPI.joinCommunity(communityId),
    onSuccess: (response, communityId) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.members(communityId) })
      toast.success('Joined community successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to join community'
      toast.error(message)
    },
  })
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (communityId: string) => communityAPI.leaveCommunity(communityId),
    onSuccess: (response, communityId) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.members(communityId) })
      toast.success('Left community successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to leave community'
      toast.error(message)
    },
  })
}

export function useCommunityMembers(communityId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: communityQueryKeys.members(communityId, page, limit),
    queryFn: async () => {
      const response = await communityAPI.getCommunityMembers(communityId, page, limit)
      return response
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: UpdateMemberRoleRequest }) =>
      communityAPI.updateMemberRole(communityId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.members(variables.communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(variables.communityId) })
      toast.success('Member role updated successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to update member role'
      toast.error(message)
    },
  })
}

// ==================== Templates ====================

export function useTemplates(communityId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: communityQueryKeys.templates(communityId, page, limit),
    queryFn: async () => {
      const response = await communityAPI.getTemplates(communityId, page, limit)
      return response
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: communityQueryKeys.template(templateId),
    queryFn: async () => {
      const response = await communityAPI.getTemplateById(templateId)
      return response.data
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: CreateTemplateRequest }) =>
      communityAPI.createTemplate(communityId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.templates(variables.communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(variables.communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.activity(variables.communityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.stats(variables.communityId) })
      toast.success('Template created successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to create template'
      toast.error(message)
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UpdateTemplateRequest }) =>
      communityAPI.updateTemplate(templateId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.template(variables.templateId) })
      // Invalidate templates list for the community (need to get communityId from template)
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all })
      toast.success('Template updated successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to update template'
      toast.error(message)
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (templateId: string) => communityAPI.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all })
      toast.success('Template deleted successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to delete template'
      toast.error(message)
    },
  })
}

export function useStartGoalFromTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data?: StartGoalFromTemplateRequest }) =>
      communityAPI.startGoalFromTemplate(templateId, data),
    onSuccess: (response, variables) => {
      // Invalidate goals list to show new goal
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      // Invalidate template to update startedGoals count
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.template(variables.templateId) })
      // Invalidate template participants
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.templateParticipants(variables.templateId) })
      // Invalidate community activity feed
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all })
      toast.success('Goal started successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to start goal'
      toast.error(message)
    },
  })
}

export function useTemplateParticipants(templateId: string, page: number = 1, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.templateParticipants(templateId, page, limit),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await communityAPI.getTemplateParticipants(templateId, pageParam, limit)
      return response
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ==================== Activity ====================

export function useActivityFeed(communityId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: communityQueryKeys.activity(communityId, page, limit),
    queryFn: async () => {
      const response = await communityAPI.getActivityFeed(communityId, page, limit)
      return response
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2, // 2 minutes (activity feed should be more fresh)
  })
}

export function useReactToActivity(communityId?: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (activityId: string) => communityAPI.reactToActivity(activityId),
    onSuccess: (response, activityId) => {
      // Optimistically update activity feed for this community
      if (communityId) {
        queryClient.setQueriesData(
          {
            queryKey: [...communityQueryKeys.detail(communityId), 'activity'],
          },
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData

            const delta = response.data.reacted ? 1 : -1

            return {
              ...oldData,
              data: oldData.data.map((activity: any) => {
                if (activity.id !== activityId) return activity
                const currentCount = activity._count?.reactions || 0
                const nextCount = Math.max(0, currentCount + delta)
                return {
                  ...activity,
                  hasUserReacted: response.data.reacted,
                  _count: {
                    ...activity._count,
                    reactions: nextCount,
                  },
                }
              }),
            }
          },
        )
      }

      // if (response.data.reacted) {
      //   toast.success('Reaction added!')
      // } else {
      //   toast.success('Reaction removed!')
      // }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to react'
      toast.error(message)
    },
    // We rely on the optimistic cache update; no heavy invalidation needed here
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: string; data: CreateCommentRequest }) =>
      communityAPI.createComment(activityId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.comments(variables.activityId) })
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all })
      toast.success('Comment added!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to add comment'
      toast.error(message)
    },
  })
}

export function useComments(activityId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: communityQueryKeys.comments(activityId, page, limit),
    queryFn: async () => {
      const response = await communityAPI.getComments(activityId, page, limit)
      return response
    },
    enabled: !!activityId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (commentId: string) => communityAPI.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all })
      toast.success('Comment deleted successfully!')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to delete comment'
      toast.error(message)
    },
  })
}

// ==================== Stats ====================

export function useCommunityStats(communityId: string) {
  return useQuery({
    queryKey: communityQueryKeys.stats(communityId),
    queryFn: async () => {
      const response = await communityAPI.getCommunityStats(communityId)
      return response.data
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
