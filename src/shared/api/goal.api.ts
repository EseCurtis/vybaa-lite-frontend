import { http } from '@/shared/api/http'

const GOALS_V2 = '/api/v2/goals'

export type GoalStatus =
  | 'ABANDONED'
  | 'ACTIVE'
  | 'AUTO_ABANDONED'
  | 'COMPLETED'
  | 'PAUSED'
export type GoalMissMode = 'FLEXIBLE' | 'NO_STREAK' | 'STRICT'
export type GoalRewardReleasePolicy = 'IMMEDIATE' | 'ON_COMPLETION'
export type GoalListFilter =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DUE'
  | 'ENDED'
  | 'OVERDUE'
  | 'PAUSED'

export type GoalTarget =
  | { count: number; type: 'CHECK_IN_COUNT' }
  | { amount: number; type: 'QUANTITY'; unit: string | null }
  | { endDate: string | null; type: 'UNTIL_DATE' }

export type GoalSchedule =
  | { date: string; type: 'ONE_TIME' }
  | { endDate?: string; startDate: string; type: 'DAILY' }
  | {
      endDate?: string
      startDate: string
      type: 'WEEKLY'
      weekday: number
    }
  | {
      endDate?: string
      startDate: string
      type: 'SELECTED_WEEKDAYS'
      weekdays: number[]
    }

export interface GoalMissPolicy {
  breakStreakOnMiss?: boolean
  forfeitPendingOnMiss?: boolean
  graceHours?: number
  maxConsecutiveMisses?: number | null
  mode: GoalMissMode
}

export interface GoalConclusion {
  adherenceRate: number
  attachments: Array<Attachment>
  completedOccurrences: number
  createdAt: string
  currentStreak: number
  durationDays: number
  earnedPoints: number
  endedAt: string
  finalProgress: number
  forfeitedPoints: number
  longestStreak: number
  missedOccurrences: number
  nextStep: string | null
  outcome: GoalStatus
  overTargetAmount: number
  rating: number | null
  reflection: string | null
  releasedPoints: number
  reviewUpdatedAt: string | null
  targetValue: number | null
}

export interface Attachment {
  name?: string
  publicId?: string
  type: 'audio' | 'image'
  url: string
}

export interface Goal {
  abandonedAt: string | null
  archivedAt: string | null
  communityId: string | null
  completedAt: string | null
  conclusion: GoalConclusion | null
  createdAt: string
  description: string | null
  hardStopDate: string
  id: string
  isDue: boolean
  isOverdue: boolean
  missPolicy: Required<Omit<GoalMissPolicy, 'maxConsecutiveMisses'>> & {
    maxConsecutiveMisses: number | null
  }
  nextOccurrence: {
    closesAt: string
    dueDate: string
    id: string
    status: 'GRACE' | 'PENDING'
  } | null
  pausedAt: string | null
  progress: {
    adherenceRate: number
    completedOccurrences: number
    currentStreak: number
    longestStreak: number
    missedOccurrences: number
    percentage: number
    value: number
  }
  reminders: string[]
  reward: {
    eligible: boolean
    eligibleAt: string | null
    earnedPoints: number
    forfeitedPoints: number
    milestones: Array<{
      id: string
      name: string
      points: number
      status: 'FORFEITED' | 'LOCKED' | 'PENDING' | 'RELEASED'
      triggerPercentage: number
    }>
    pendingPoints: number
    releasePolicy: GoalRewardReleasePolicy
    releasedPoints: number
    totalPotential: number
  }
  schedule: {
    endDate: string | null
    startDate: string
    type: GoalSchedule['type']
    weekdays: number[]
  }
  startedAt: string
  status: GoalStatus
  target: GoalTarget
  templateId: string | null
  title: string
  updatedAt: string
}

export interface LegacyGoal {
  archivedAt: string | null
  community: { id: string; name: string } | null
  currentDay: number
  id: string
  isCompleted: boolean
  lastCheckInDate: string | null
  legacy: true
  reminderTime: string | null
  startedAt: string
  targetDays: number
  title: string
}

export interface GoalOccurrence {
  closesAt: string
  completedAt: string | null
  dueDate: string
  graceEndsAt: string | null
  id: string
  originalDueDate: string
  progress: {
    amount: number
    attachments: Attachment[] | null
    createdAt: string
    notes: string | null
  } | null
  rescheduledAt: string | null
  status: 'CANCELLED' | 'COMPLETED' | 'GRACE' | 'MISSED' | 'PENDING'
}

export interface GoalOccurrencesResponse {
  data: GoalOccurrence[]
  msg: string
  pagination: { hasMore: boolean; nextCursor: string | null }
}

export interface CreateGoalRequest {
  description?: string
  hardStopDate?: string
  missPolicy: GoalMissPolicy
  reminderTimes: string[]
  rewardReleasePolicy: GoalRewardReleasePolicy
  schedule: GoalSchedule
  sourceRecommendationId?: string
  target: GoalTarget
  title: string
}

export interface GoalsListResponse {
  data: Goal[]
  msg: string
  pagination: { hasMore: boolean; nextCursor: string | null }
}

interface GoalResponse {
  data: Goal
  msg: string
}

export const goalAPI = {
  abandon: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/abandon`,
    )
    return response.data
  },
  archive: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/archive`,
    )
    return response.data
  },
  archiveLegacy: async (goalId: string): Promise<void> => {
    await http.patch(`${GOALS_V2}/legacy/${goalId}/archive`)
  },
  deleteLegacy: async (goalId: string): Promise<void> => {
    await http.delete(`${GOALS_V2}/legacy/${goalId}`)
  },
  create: async (input: CreateGoalRequest): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(GOALS_V2, input)
    return response.data
  },
  get: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.get<GoalResponse>(`${GOALS_V2}/${goalId}`)
    return response.data
  },
  list: async (
    filter: GoalListFilter,
    cursor?: string,
    limit = 20,
  ): Promise<GoalsListResponse> => {
    const response = await http.get<GoalsListResponse>(GOALS_V2, {
      params: { cursor, filter, limit },
    })
    return response.data
  },
  listLegacy: async (): Promise<{ data: LegacyGoal[] }> => {
    const response = await http.get<{ data: LegacyGoal[] }>(
      `${GOALS_V2}/legacy`,
    )
    return response.data
  },
  listOccurrences: async (
    goalId: string,
    cursor?: string,
    limit = 20,
  ): Promise<GoalOccurrencesResponse> => {
    const response = await http.get<GoalOccurrencesResponse>(
      `${GOALS_V2}/${goalId}/occurrences`,
      { params: { cursor, limit } },
    )
    return response.data
  },
  pause: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/pause`,
    )
    return response.data
  },
  permanentlyDelete: async (goalId: string): Promise<void> => {
    await http.delete(`${GOALS_V2}/${goalId}`)
  },
  correctProgress: async (
    goalId: string,
    occurrenceId: string,
    input: { amount?: number; attachments?: Attachment[]; notes?: string },
  ): Promise<GoalResponse> => {
    const response = await http.patch<GoalResponse>(
      `${GOALS_V2}/${goalId}/occurrences/${occurrenceId}/progress`,
      input,
    )
    return response.data
  },
  recordProgress: async (
    goalId: string,
    occurrenceId: string,
    input: { amount?: number; attachments?: Attachment[]; notes?: string },
  ): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/occurrences/${occurrenceId}/progress`,
      input,
    )
    return response.data
  },
  reopen: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/reopen`,
    )
    return response.data
  },
  reopenLegacy: async (goalId: string): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/legacy/${goalId}/reopen`,
    )
    return response.data
  },
  reschedule: async (
    goalId: string,
    occurrenceId: string,
    dueDate: string,
  ): Promise<GoalResponse> => {
    const response = await http.patch<GoalResponse>(
      `${GOALS_V2}/${goalId}/occurrences/${occurrenceId}/reschedule`,
      { dueDate },
    )
    return response.data
  },
  resume: async (
    goalId: string,
    deadlinePolicy: 'KEEP_DEADLINE' | 'SHIFT_DEADLINE',
  ): Promise<GoalResponse> => {
    const response = await http.post<GoalResponse>(
      `${GOALS_V2}/${goalId}/resume`,
      {
        deadlinePolicy,
      },
    )
    return response.data
  },
  saveReview: async (
    goalId: string,
    input: {
      attachments?: Attachment[]
      nextStep?: string | null
      rating?: number | null
      reflection?: string | null
    },
  ): Promise<GoalResponse> => {
    const response = await http.patch<GoalResponse>(
      `${GOALS_V2}/${goalId}/conclusion/review`,
      input,
    )
    return response.data
  },
  update: async (
    goalId: string,
    input: Partial<Pick<Goal, 'description' | 'title'>> & {
      missPolicy?: GoalMissPolicy
      reminderTimes?: string[]
    },
  ): Promise<GoalResponse> => {
    const response = await http.patch<GoalResponse>(
      `${GOALS_V2}/${goalId}`,
      input,
    )
    return response.data
  },
  undoProgress: async (
    goalId: string,
    occurrenceId: string,
  ): Promise<GoalResponse> => {
    const response = await http.delete<GoalResponse>(
      `${GOALS_V2}/${goalId}/occurrences/${occurrenceId}/progress`,
    )
    return response.data
  },
}
