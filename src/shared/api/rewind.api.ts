import ENV from '@/env'
import { joinApiUrl } from '@/shared/api/api-url.util'
import { ApiError, getCurrentTimezone, http } from '@/shared/api/http'
import type { GoalSchedule, GoalTarget } from '@/shared/api/goal.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const API_V1 = '/api/v1'
const API_V2 = '/api/v2'

export type RewindSession = {
  id: string
  userId: string
  voiceProvider?: 'ELEVENLABS' | 'GEMINI'
  personaId: RewindPersonaId
  sessionDateKey: string | null
  scheduledFor: string | null
  windowEndsAt: string | null
  startedAt: string | null
  status:
    | 'LEGACY'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'FINALIZING'
    | 'COMPLETED'
    | 'MISSED'
  completed: boolean
  completedAt: string | null
  checkInAt: string | null
  dailyObservation?: RewindObservation | null
  summary: string
  emotionalInsight: string | null
  emotionalTags: string[]
  nextStepNote: string | null
  comparisonInsight: string | null
  journalDraft: string | null
  wellbeingSignals: RewindWellbeingSignals | null
  journalId: string | null
  journalSavedAt: string | null
  transcriptAvailable?: boolean
  turns?: RewindTurn[]
  recommendations?: RewindRecommendation[]
  createdAt: string
  updatedAt: string
}

export type RewindRecommendation =
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        amount?: number
        goalId: string
        notes?: string
        occurrenceId: string
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'GOAL_PROGRESS'
    }
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        description?: string
        reminderTimes: string[]
        schedule: GoalSchedule
        target: GoalTarget
        title: string
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'NEW_GOAL'
    }
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        achievementId?: string
        cardType: 'achievement' | 'daily' | 'rewind' | 'streak' | 'weekly'
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'FLEXX'
    }

export type RewindRecommendationStatus =
  | 'ACCEPTED'
  | 'DISMISSED'
  | 'EXPIRED'
  | 'PENDING'

export type RewindTurn = {
  id: string
  role: 'USER' | 'PARTNER'
  sequence: number
  content: string
  createdAt: string
}

export type RewindWellbeingSignals = {
  agency: number
  clarity: number
  connection: number
  emotionalSteadiness: number
  energy: number
}

export type RewindInsightsRange = '7d' | '30d' | '90d'

export type RewindInsights = {
  range: RewindInsightsRange
  coverage: {
    completedDays: number
    completedSessions: number
    days: number
  }
  hasSufficientData: boolean
  signals: RewindWellbeingSignals | null
  deltas: RewindWellbeingSignals | null
  progress: {
    clarity: number
    consistency: number
    momentum: number
  } | null
  contextualInsight: string | null
}

export type RewindLiveTokenResponse = {
  msg: string
  data: {
    token: string
    wsUrl: string
    personaId: RewindPersonaId
    sessionId: string
    sessionDateKey: string | null
    scheduledFor: string | null
    windowEndsAt: string | null
    provider?: 'ELEVENLABS' | 'GEMINI'
  }
}

export type RewindRoutineFrequency =
  | 'MORNINGS_AND_EVENINGS'
  | 'JUST_MORNINGS'
  | 'JUST_EVENINGS'
  | 'CUSTOM'

export type RewindRoutineIntent =
  | 'UNDERSTAND_EMOTIONS'
  | 'SPOT_PATTERNS'
  | 'BUILD_SMALL_CHANGES'
  | 'CUSTOM'

export type RewindRoutine = {
  id: string
  frequency: RewindRoutineFrequency
  times: string[]
  intent: RewindRoutineIntent
  customIntent: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type RewindOccurrence = {
  id: string
  scheduledFor: string | null
  status: RewindSession['status']
  windowEndsAt: string | null
}

export type RewindRoutineOverview = {
  currentSession: RewindOccurrence | null
  latestSession: RewindOccurrence | null
  nextSession: RewindOccurrence | null
  routine: RewindRoutine | null
  timezone: string
}

export type RewindRoutineResponse = {
  msg: string
  data: RewindRoutineOverview
}

export type UpdateRewindRoutineInput = {
  frequency: RewindRoutineFrequency
  intent: RewindRoutineIntent
  times?: string[]
  customIntent?: string | null
  timezone: string
}

export type RewindSessionsFilters = {
  day?: string
  personaId?: RewindPersonaId
}

export type RewindSessionsFacets = {
  days: Array<{
    count: number
    key: string
  }>
  partners: Array<{
    count: number
    id: RewindPersonaId
  }>
}

export type RewindSessionsSummary = {
  completed: number
  open: number
  total: number
}

export type PaginatedRewindSessionsResponse = {
  msg: string
  data: {
    filters: RewindSessionsFacets
    summary: RewindSessionsSummary
    sessions: RewindSession[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export type RewindSessionResponse = {
  msg: string
  data: RewindSession
}

export type RewindInsightsResponse = {
  msg: string
  data: RewindInsights
}

export type RewindActivitySource =
  | 'ACHIEVEMENT'
  | 'FLEXX'
  | 'GOAL'
  | 'JOURNAL'
  | 'REWARD'
  | 'REWIND_CHAT'
  | 'REWIND_ROUTINE'
  | 'REWIND_VOICE'

export type RewindObservationEvidence = {
  description: string
  eventType: string
  happenedAt: string
  id: string
  sourceId: string
  sourceType: RewindActivitySource
}

export type RewindObservation = {
  confidence: number
  createdAt: string
  description: string
  dismissedAt: string | null
  evidence: RewindObservationEvidence[]
  homeGreeting: string | null
  id: string
  journalDraft: string | null
  localDateKey: string
  observations: string[]
  personaId: RewindPersonaId | null
  reflection: string | null
  sourceTypes: RewindActivitySource[]
  updatedAt: string
}

export type RewindHomeGreeting = {
  chatId: string
  date: string | null
  message: string | null
  messageId: string | null
  personaId: RewindPersonaId | null
  sourceTypes: RewindActivitySource[]
  title: string
}

export type RewindChatMessage = {
  content: string
  createdAt: string
  deliveredAt?: string | null
  id: string
  localDateKey: string
  mentions: RewindPersonaId[]
  personaId: RewindPersonaId | null
  reactions?: RewindChatReaction[]
  replyToMessageId?: string | null
  role: 'PARTNER' | 'SYSTEM' | 'USER'
  runId?: string | null
  seenAt?: string | null
  turnId?: string | null
}

export type RewindChatReactionKind = 'LOVE' | 'LAUGH' | 'CRY' | 'LIKE'

export type RewindChatReaction = {
  actor: 'PARTNER' | 'USER'
  kind: RewindChatReactionKind
  personaId: RewindPersonaId | null
}

export type EnqueueRewindChatMessageInput = {
  content: string
  idempotencyKey: string
  replyToMessageId?: string | null
}

export type RewindChatRun = {
  id: string
  status:
    | 'CANCELLED'
    | 'COMPLETED'
    | 'FAILED'
    | 'GENERATING'
    | 'PLANNING'
    | 'QUEUED'
  turnsUsed: number
}

export type RewindChatTurn = {
  id: string
  personaId: RewindPersonaId
  runId: string
  status: 'CANCELLED' | 'COMPLETED' | 'FAILED' | 'GENERATING' | 'PLANNED'
}

export type RewindChatRealtimeEvent =
  | { chatId: string; runId: string; status: string; type: 'run_state' }
  | {
      chatId: string
      personaId: RewindPersonaId
      runId: string
      turnId: string
      type: 'typing_started' | 'typing_stopped'
    }
  | {
      chatId: string
      delta: string
      personaId: RewindPersonaId
      runId: string
      sequence: number
      turnId: string
      type: 'message_delta'
    }
  | {
      chatId: string
      message: RewindChatMessage
      messageId: string
      runId: string
      turnId: string
      type: 'message_committed'
    }
  | { chatId: string; messageId: string; type: 'user_message_committed' }
  | {
      chatId: string
      messageId: string
      reactions: RewindChatReaction[]
      type: 'reaction_updated'
    }
  | {
      chatId: string
      messageId: string
      runId: string
      seenAt: string
      type: 'user_message_seen'
    }
  | { chatId: string; runId: string; type: 'chat_invalidated' }
  | {
      chatId: string
      code: string
      message: string
      runId: string
      type: 'run_failed'
    }

export type RewindChatStreamEvent =
  | { message: RewindChatMessage; type: 'user_message' }
  | { personaId: RewindPersonaId; type: 'typing_started' }
  | {
      delta: string
      personaId: RewindPersonaId
      type: 'message_delta'
    }
  | { message: RewindChatMessage; type: 'message_complete' }
  | { personaId: RewindPersonaId; type: 'typing_stopped' }
  | { type: 'complete' }
  | { code: string; message: string; type: 'error' }

export type RewindChat = {
  activeParticipants?: RewindPersonaId[]
  archivedAt: string | null
  contextRevision?: number
  createdAt: string
  id: string
  lastMessage: RewindChatMessage | null
  lastMessageAt: string | null
  personaId: RewindPersonaId | null
  proactiveMuted?: boolean
  threadKey: string
  title: string
  type: 'GROUP' | 'PARTNER'
  unreadCount?: number
  updatedAt: string
}

export type RewindObservationsResponse = {
  data: {
    items: RewindObservation[]
    nextCursor: string | null
  }
  msg: string
}

export type RewindChatsResponse = {
  data: { chats: RewindChat[] }
  msg: string
}

export type RewindChatMessagesResponse = {
  data: {
    chat: RewindChat
    items: RewindChatMessage[]
    nextCursor: string | null
  }
  msg: string
}

export type RewindV2ChatMessagesResponse = {
  data: {
    activeTurns: RewindChatTurn[]
    chat: Pick<
      RewindChat,
      'contextRevision' | 'id' | 'proactiveMuted' | 'unreadCount'
    >
    items: RewindChatMessage[]
    nextCursor: string | null
  }
  msg: string
}

export type RewindV2EnqueueResponse = {
  data: { runId: string; userMessage: RewindChatMessage }
  msg: string
}

export type SendRewindChatMessageResponse = {
  data: {
    partnerMessage: RewindChatMessage
    userMessage: RewindChatMessage
  }
  msg: string
}

export type AddRewindToJournalResponse = {
  msg: string
  data: {
    journal: {
      id: string
      content: string
      date: string
    }
    saved: boolean
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRewindPersonaId(value: unknown): value is RewindPersonaId {
  return (
    value === 'ariel' ||
    value === 'ella' ||
    value === 'jake' ||
    value === 'lyra' ||
    value === 'tobi' ||
    value === 'neeja'
  )
}

function isRewindChatReactionKind(
  value: unknown,
): value is RewindChatReactionKind {
  return (
    value === 'CRY' || value === 'LAUGH' || value === 'LIKE' || value === 'LOVE'
  )
}

function isRewindChatReaction(value: unknown): value is RewindChatReaction {
  if (!isRecord(value)) return false
  return (
    isRewindChatReactionKind(value.kind) &&
    ((value.actor === 'USER' && value.personaId === null) ||
      (value.actor === 'PARTNER' && isRewindPersonaId(value.personaId)))
  )
}

function isRewindChatMessage(value: unknown): value is RewindChatMessage {
  if (!isRecord(value)) return false
  return (
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.deliveredAt === undefined ||
      value.deliveredAt === null ||
      typeof value.deliveredAt === 'string') &&
    typeof value.id === 'string' &&
    typeof value.localDateKey === 'string' &&
    (value.replyToMessageId === undefined ||
      value.replyToMessageId === null ||
      typeof value.replyToMessageId === 'string') &&
    (value.runId === undefined ||
      value.runId === null ||
      typeof value.runId === 'string') &&
    (value.seenAt === undefined ||
      value.seenAt === null ||
      typeof value.seenAt === 'string') &&
    (value.turnId === undefined ||
      value.turnId === null ||
      typeof value.turnId === 'string') &&
    (value.reactions === undefined ||
      (Array.isArray(value.reactions) &&
        value.reactions.every(isRewindChatReaction))) &&
    Array.isArray(value.mentions) &&
    (value.personaId === null || isRewindPersonaId(value.personaId)) &&
    (value.role === 'PARTNER' ||
      value.role === 'SYSTEM' ||
      value.role === 'USER')
  )
}

export function isRewindChatRealtimeEvent(
  value: unknown,
): value is RewindChatRealtimeEvent {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  if (value.type === 'message_delta') {
    return (
      typeof value.chatId === 'string' &&
      typeof value.delta === 'string' &&
      isRewindPersonaId(value.personaId) &&
      typeof value.runId === 'string' &&
      typeof value.sequence === 'number' &&
      typeof value.turnId === 'string'
    )
  }
  if (value.type === 'typing_started' || value.type === 'typing_stopped') {
    return (
      typeof value.chatId === 'string' &&
      isRewindPersonaId(value.personaId) &&
      typeof value.runId === 'string' &&
      typeof value.turnId === 'string'
    )
  }
  if (value.type === 'message_committed') {
    return (
      typeof value.chatId === 'string' &&
      typeof value.messageId === 'string' &&
      isRewindChatMessage(value.message) &&
      value.message.id === value.messageId &&
      typeof value.runId === 'string' &&
      typeof value.turnId === 'string'
    )
  }
  if (value.type === 'user_message_committed') {
    return (
      typeof value.chatId === 'string' && typeof value.messageId === 'string'
    )
  }
  if (value.type === 'reaction_updated') {
    return (
      typeof value.chatId === 'string' &&
      typeof value.messageId === 'string' &&
      Array.isArray(value.reactions) &&
      value.reactions.every(isRewindChatReaction)
    )
  }
  if (value.type === 'user_message_seen') {
    return (
      typeof value.chatId === 'string' &&
      typeof value.messageId === 'string' &&
      typeof value.runId === 'string' &&
      typeof value.seenAt === 'string'
    )
  }
  if (value.type === 'chat_invalidated') {
    return typeof value.chatId === 'string' && typeof value.runId === 'string'
  }
  if (value.type === 'run_state') {
    return (
      typeof value.chatId === 'string' &&
      typeof value.runId === 'string' &&
      typeof value.status === 'string'
    )
  }
  return (
    value.type === 'run_failed' &&
    typeof value.chatId === 'string' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    typeof value.runId === 'string'
  )
}

function parseRewindChatStreamEvent(
  value: unknown,
): RewindChatStreamEvent | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null
  if (value.type === 'complete') return { type: 'complete' }
  if (
    (value.type === 'user_message' || value.type === 'message_complete') &&
    isRewindChatMessage(value.message)
  ) {
    return { message: value.message, type: value.type }
  }
  if (
    (value.type === 'typing_started' || value.type === 'typing_stopped') &&
    isRewindPersonaId(value.personaId)
  ) {
    return { personaId: value.personaId, type: value.type }
  }
  if (
    value.type === 'message_delta' &&
    typeof value.delta === 'string' &&
    isRewindPersonaId(value.personaId)
  ) {
    return {
      delta: value.delta,
      personaId: value.personaId,
      type: 'message_delta',
    }
  }
  if (
    value.type === 'error' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  ) {
    return { code: value.code, message: value.message, type: 'error' }
  }
  return null
}

async function getRewindStreamErrorMessage(
  response: Response,
): Promise<string> {
  const fallbackMessage =
    response.status === 404
      ? 'Rewind chat is not available on this server yet'
      : 'Your message could not be sent'
  const responseText = await response.text()
  if (!responseText) return fallbackMessage

  try {
    const parsed: unknown = JSON.parse(responseText)
    if (isRecord(parsed) && typeof parsed.msg === 'string') return parsed.msg
  } catch (error: unknown) {
    console.warn('Rewind chat returned a non-JSON error response', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      status: response.status,
    })
  }
  return fallbackMessage
}

class RewindAPI {
  async acceptRecommendation(
    sessionId: string,
    recommendationId: string,
  ): Promise<{ data: RewindRecommendation; msg: string }> {
    const { data: response } = await http.post<{
      data: RewindRecommendation
      msg: string
    }>(
      `${API_V1}/rewind/sessions/${sessionId}/recommendations/${recommendationId}/accept`,
    )
    return response
  }

  async createLiveToken(
    personaId: RewindPersonaId,
    sessionId?: string | null,
  ): Promise<RewindLiveTokenResponse> {
    const { data: res } = await http.post<RewindLiveTokenResponse>(
      `${API_V1}/rewind/live-token`,
      { personaId, sessionId },
    )
    return res
  }

  async getPaginatedSessions(
    page: number = 1,
    limit: number = 10,
    filters?: RewindSessionsFilters,
  ): Promise<PaginatedRewindSessionsResponse> {
    const { data: res } = await http.get<PaginatedRewindSessionsResponse>(
      `${API_V1}/rewind/sessions`,
      {
        params: {
          day: filters?.day,
          limit,
          page,
          personaId: filters?.personaId,
        },
      },
    )
    return res
  }

  async getRoutine(): Promise<RewindRoutineResponse> {
    const { data: res } = await http.get<RewindRoutineResponse>(
      `${API_V1}/rewind/routine`,
    )
    return res
  }

  async updateRoutine(
    input: UpdateRewindRoutineInput,
  ): Promise<RewindRoutineResponse> {
    const { data: res } = await http.put<RewindRoutineResponse>(
      `${API_V1}/rewind/routine`,
      input,
    )
    return res
  }

  async getSession(sessionId: string): Promise<RewindSessionResponse> {
    const { data: res } = await http.get<RewindSessionResponse>(
      `${API_V1}/rewind/sessions/${sessionId}`,
    )
    return res
  }

  async getInsights(
    range: RewindInsightsRange,
  ): Promise<RewindInsightsResponse> {
    const { data: res } = await http.get<RewindInsightsResponse>(
      `${API_V1}/rewind/insights`,
      { params: { range } },
    )
    return res
  }

  async getHomeGreeting(): Promise<{
    data: RewindHomeGreeting | null
    msg: string
  }> {
    const { data: res } = await http.get<{
      data: RewindHomeGreeting | null
      msg: string
    }>(`${API_V1}/rewind/home-greeting`)
    return res
  }

  async getObservations(
    cursor?: string,
    limit: number = 12,
  ): Promise<RewindObservationsResponse> {
    const { data: res } = await http.get<RewindObservationsResponse>(
      `${API_V1}/rewind/observations`,
      { params: { cursor, limit } },
    )
    return res
  }

  async dismissObservation(observationId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/rewind/observations/${observationId}`,
    )
    return res
  }

  async getChats(): Promise<RewindChatsResponse> {
    const { data: res } = await http.get<RewindChatsResponse>(
      `${API_V1}/rewind/chats`,
    )
    return res
  }

  async getV2Chats(): Promise<RewindChatsResponse> {
    const { data: res } = await http.get<RewindChatsResponse>(
      `${API_V2}/rewind/chats`,
    )
    return res
  }

  async getV2ChatMessages(
    chatId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<RewindV2ChatMessagesResponse> {
    const { data: res } = await http.get<RewindV2ChatMessagesResponse>(
      `${API_V2}/rewind/chats/${chatId}/messages`,
      { params: { cursor, limit } },
    )
    return res
  }

  async enqueueV2ChatMessage(
    chatId: string,
    input: EnqueueRewindChatMessageInput,
  ): Promise<RewindV2EnqueueResponse> {
    const { data: res } = await http.post<RewindV2EnqueueResponse>(
      `${API_V2}/rewind/chats/${chatId}/messages`,
      input,
    )
    return res
  }

  async markV2ChatRead(
    chatId: string,
    throughMessageId: string,
  ): Promise<void> {
    await http.post(`${API_V2}/rewind/chats/${chatId}/read`, {
      throughMessageId,
    })
  }

  async updateV2ChatReaction(
    chatId: string,
    messageId: string,
    reaction: RewindChatReactionKind | null,
  ): Promise<{ data: { reactions: RewindChatReaction[] }; msg: string }> {
    const { data: response } = await http.put<{
      data: { reactions: RewindChatReaction[] }
      msg: string
    }>(`${API_V2}/rewind/chats/${chatId}/messages/${messageId}/reaction`, {
      reaction,
    })
    return response
  }

  async updateV2ChatPreferences(
    chatId: string,
    proactiveMuted: boolean,
  ): Promise<void> {
    await http.patch(`${API_V2}/rewind/chats/${chatId}/preferences`, {
      proactiveMuted,
    })
  }

  async renameV2Chat(
    chatId: string,
    title: string,
  ): Promise<{ data: { title: string }; msg: string }> {
    const { data: response } = await http.patch<{
      data: { title: string }
      msg: string
    }>(`${API_V2}/rewind/chats/${chatId}`, { title })
    return response
  }

  async deleteV2ChatMessage(
    chatId: string,
    messageId: string,
  ): Promise<{ data: { deletedCount: number }; msg: string }> {
    const { data: response } = await http.delete<{
      data: { deletedCount: number }
      msg: string
    }>(`${API_V2}/rewind/chats/${chatId}/messages/${messageId}`)
    return response
  }

  async clearV2Chat(
    chatId: string,
  ): Promise<{ data: { deletedCount: number }; msg: string }> {
    const { data: response } = await http.delete<{
      data: { deletedCount: number }
      msg: string
    }>(`${API_V2}/rewind/chats/${chatId}/messages`)
    return response
  }

  async getV2ChatLiveState(
    chatId: string,
  ): Promise<{ data: { runs: RewindChatRun[] }; msg: string }> {
    const { data: res } = await http.get<{
      data: { runs: RewindChatRun[] }
      msg: string
    }>(`${API_V2}/rewind/chats/${chatId}/live-state`)
    return res
  }

  async getChatMessages(
    chatId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<RewindChatMessagesResponse> {
    const { data: res } = await http.get<RewindChatMessagesResponse>(
      `${API_V1}/rewind/chats/${chatId}/messages`,
      { params: { cursor, limit } },
    )
    return res
  }

  async sendChatMessage(
    chatId: string,
    input: { content: string; idempotencyKey: string },
  ): Promise<SendRewindChatMessageResponse> {
    const { data: res } = await http.post<SendRewindChatMessageResponse>(
      `${API_V1}/rewind/chats/${chatId}/messages`,
      input,
    )
    return res
  }

  async streamChatMessage(
    chatId: string,
    input: { content: string; idempotencyKey: string },
    onEvent: (event: RewindChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = localStorage.getItem('authToken')
    const response = await fetch(
      joinApiUrl(
        ENV.API_BASE_URL,
        `${API_V1}/rewind/chats/${chatId}/messages/stream`,
      ),
      {
        body: JSON.stringify(input),
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-user-tz': getCurrentTimezone(),
          tzx: getCurrentTimezone(),
        },
        method: 'POST',
        signal,
      },
    )
    if (!response.ok) {
      const message = await getRewindStreamErrorMessage(response)
      throw new ApiError(message, { status: response.status })
    }
    if (!response.body) {
      throw new ApiError('The conversation stream did not start')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const consumeLine = (line: string): void => {
      const normalized = line.trim()
      if (!normalized) return
      let parsed: unknown
      try {
        parsed = JSON.parse(normalized)
      } catch {
        throw new ApiError('The conversation stream was interrupted')
      }
      const event = parseRewindChatStreamEvent(parsed)
      if (!event) return
      onEvent(event)
      if (event.type === 'error') {
        throw new ApiError(event.message, { code: event.code })
      }
    }

    while (true) {
      const result = await reader.read()
      buffer += decoder.decode(result.value, { stream: !result.done })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) consumeLine(line)
      if (result.done) break
    }
    if (buffer.trim()) consumeLine(buffer)
  }

  async archiveChat(
    chatId: string,
    archived: boolean,
  ): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(
      `${API_V1}/rewind/chats/${chatId}`,
      { archived },
    )
    return res
  }

  async recordFlexxActivity(input: {
    description: string
    eventType: 'FLEXX_CREATED' | 'FLEXX_SHARED'
    happenedAt?: string
    sourceId: string
  }): Promise<void> {
    await http.post(`${API_V1}/rewind/activity`, input)
  }

  async dismissRecommendation(
    sessionId: string,
    recommendationId: string,
  ): Promise<{ data: RewindRecommendation; msg: string }> {
    const { data: response } = await http.post<{
      data: RewindRecommendation
      msg: string
    }>(
      `${API_V1}/rewind/sessions/${sessionId}/recommendations/${recommendationId}/dismiss`,
    )
    return response
  }

  async addSessionToJournal(
    sessionId: string,
  ): Promise<AddRewindToJournalResponse> {
    const { data: res } = await http.post<AddRewindToJournalResponse>(
      `${API_V1}/rewind/sessions/${sessionId}/add-to-journal`,
    )
    return res
  }
}

export const rewindAPI = new RewindAPI()
