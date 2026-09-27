import type { Goal, GoalOccurrence } from '@/shared/api/goal.api'
import type {
  RewindChat,
  RewindChatMessage,
  RewindSession,
} from '@/shared/api/rewind.api'
import type { Post, Slide } from '../../web/src/components/tiktok/schema'
import { blocked, noop } from './runtime'

declare global {
  interface Window {
    __capture: { post: Post; slide: Slide; index: number }
  }
}
export const { post, slide, index } = window.__capture
export const day = new Date(
  Date.UTC(2026, 8, slide.screen === 'goal-create' ? 12 : 13),
)
  .toISOString()
  .slice(0, 10)
const previousDay = new Date(Date.UTC(2026, 8, 12)).toISOString().slice(0, 10)
const stamp = `${day}T19:00:00+01:00`
const messages: RewindChatMessage[] = post.messages
  .slice(0, slide.reveal)
  .map((message) => ({
    content: message.text,
    id: message.id,
    personaId: message.speaker === 'chet' ? null : message.speaker,
    role: message.speaker === 'chet' ? 'USER' : 'PARTNER',
    localDateKey: day,
    mentions: [],
    createdAt: `${day}T19:${String(message.minute).padStart(2, '0')}:00+01:00`,
    seenAt: stamp,
  }))
const group: RewindChat = {
  id: 'capture-chat',
  title: 'Chet & friends',
  type: 'GROUP',
  threadKey: 'capture',
  personaId: null,
  archivedAt: null,
  createdAt: stamp,
  updatedAt: stamp,
  lastMessageAt: stamp,
  lastMessage: messages.at(-1) ?? null,
  activeParticipants: [],
  unreadCount: 0,
}
const chats: RewindChat[] = [
  group,
  ...post.cast.map(
    (personaId): RewindChat => ({
      ...group,
      id: personaId,
      title: personaId[0].toUpperCase() + personaId.slice(1),
      personaId,
      type: 'PARTNER',
      lastMessage: null,
      lastMessageAt: null,
    }),
  ),
]
const result = {
  isLoading: false,
  isError: false,
  error: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  refetch: noop,
  fetchNextPage: noop,
}
const chatQuery = { ...result, data: chats }
const messageQuery = {
  ...result,
  data: {
    pages: [
      { items: messages, activeTurns: [], chat: group, nextCursor: null },
    ],
  },
}
export function useRewindChats() {
  return chatQuery
}
export function useRewindChatMessages() {
  return messageQuery
}
const mutation = { isPending: false, mutate: noop, mutateAsync: blocked }
export function useMarkRewindChatRead() {
  return mutation
}
const blockedMutation = {
  isPending: false,
  mutate: blocked,
  mutateAsync: blocked,
}
export function useEnqueueRewindChatMessage() {
  return blockedMutation
}
export const useMuteRewindChat = useEnqueueRewindChatMessage
export const useReactToRewindChatMessage = useEnqueueRewindChatMessage
export const useDeleteRewindChatMessage = useEnqueueRewindChatMessage

const goal: Goal = {
  id: 'capture-goal',
  title: post.goal.title,
  description: post.goal.reason,
  status: 'ACTIVE',
  abandonedAt: null,
  archivedAt: null,
  communityId: null,
  completedAt: null,
  conclusion: null,
  createdAt: `${previousDay}T08:00:00+01:00`,
  startedAt: previousDay,
  updatedAt: stamp,
  hardStopDate: '2026-12-31',
  isDue: false,
  isOverdue: false,
  nextOccurrence: {
    id: 'occurrence-next',
    dueDate: `${day}T23:30:00+01:00`,
    closesAt: `${day}T23:59:59+01:00`,
    status: 'PENDING',
  },
  pausedAt: null,
  templateId: null,
  missPolicy: {
    breakStreakOnMiss: true,
    forfeitPendingOnMiss: false,
    graceHours: 0,
    maxConsecutiveMisses: null,
    mode: 'FLEXIBLE',
  },
  progress: {
    adherenceRate: 0,
    completedOccurrences: 0,
    currentStreak: 0,
    longestStreak: 0,
    missedOccurrences: slide.goalState === 'missed' ? 1 : 0,
    percentage: 0,
    value: 0,
  },
  reminders: [post.goal.reminder],
  reward: {
    eligible: false,
    eligibleAt: null,
    earnedPoints: 0,
    forfeitedPoints: 0,
    milestones: [],
    pendingPoints: 0,
    releasePolicy: 'ON_COMPLETION',
    releasedPoints: 0,
    totalPotential: 0,
  },
  schedule: {
    endDate: null,
    startDate: previousDay,
    type: 'DAILY',
    weekdays: [],
  },
  target: { type: 'CHECK_IN_COUNT', count: 7 },
}
const occurrences: GoalOccurrence[] = [
  {
    id: 'occurrence-1',
    closesAt: `${day}T00:00:00+01:00`,
    completedAt: null,
    dueDate: previousDay,
    graceEndsAt: null,
    originalDueDate: previousDay,
    progress: null,
    rescheduledAt: null,
    status: slide.goalState === 'missed' ? 'MISSED' : 'PENDING',
  },
]
export function useGoal() {
  return { ...result, data: goal }
}
export function useGoalOccurrences() {
  return { ...result, data: { pages: [{ data: occurrences }] } }
}
export const useCreateGoal = useEnqueueRewindChatMessage
export const useAbandonGoal = useEnqueueRewindChatMessage
export const useArchiveGoal = useEnqueueRewindChatMessage
export const useCorrectGoalProgress = useEnqueueRewindChatMessage
export const usePauseGoal = useEnqueueRewindChatMessage
export const usePermanentlyDeleteGoal = useEnqueueRewindChatMessage
export const useRecordGoalProgress = useEnqueueRewindChatMessage
export const useReopenGoal = useEnqueueRewindChatMessage
export const useRescheduleGoalOccurrence = useEnqueueRewindChatMessage
export const useResumeGoal = useEnqueueRewindChatMessage
export const useSaveGoalReview = useEnqueueRewindChatMessage
export const useUndoGoalProgress = useEnqueueRewindChatMessage

const session: RewindSession = {
  id: 'capture-session',
  userId: 'chet',
  personaId: post.cast[0],
  sessionDateKey: day,
  scheduledFor: null,
  windowEndsAt: null,
  startedAt: `${day}T21:00:00+01:00`,
  status: 'COMPLETED',
  completed: true,
  completedAt: `${day}T21:05:00+01:00`,
  checkInAt: stamp,
  summary: post.reflection,
  emotionalInsight: null,
  emotionalTags: [],
  nextStepNote: null,
  comparisonInsight: null,
  journalDraft: null,
  wellbeingSignals: null,
  journalId: null,
  journalSavedAt: null,
  createdAt: `${day}T21:00:00+01:00`,
  updatedAt: stamp,
  transcriptAvailable: true,
  turns: [],
}
export function usePaginatedRewindSessions() {
  return { ...result, data: { pages: [{ data: [session] }] } }
}
export function useRewindSession() {
  return { ...result, data: session }
}
export const useSaveRewindJournal = useEnqueueRewindChatMessage
