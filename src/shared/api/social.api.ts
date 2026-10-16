import { http } from '@/shared/api/http'

const API_V2 = '/api/v2/social'

export type SocialScheduleFrequency = 'DAILY' | 'WEEKLY'
export type SocialDraftType = 'POST' | 'THREAD' | 'REPLY'
export type SocialDraftStatus =
  | 'DRAFT'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'PARTIALLY_PUBLISHED'
  | 'PUBLISH_FAILED'
  | 'DISCARDED'

export type SocialDraft = {
  createdAt: string
  id: string
  publishedAt: string | null
  publishedTweetIds: string[]
  segments: string[]
  sourceLabel: string | null
  sourceMentionId: string | null
  sourceReason: string | null
  status: SocialDraftStatus
  type: SocialDraftType
  updatedAt: string
}

export type SocialMention = {
  authorDisplayName: string | null
  authorUsername: string
  id: string
  postedAt: string
  referencedTweetIds: string[]
  text: string
  xTweetId: string
}

export type SocialStudioPreferences = {
  audience: string | null
  aiDraftingConsentAt: string | null
  activitySuggestionConsentAt: string | null
  avoidTopics: string[]
  lastSuggestionAt: string | null
  nextSuggestionAt: string | null
  scheduleDayOfWeek: number
  scheduleEnabled: boolean
  scheduleFrequency: SocialScheduleFrequency
  scheduleTime: string
  scheduleTimezone: string
  tone: string | null
  topics: string[]
  updatedAt: string
  voiceNotes: string | null
}

export type SocialStudioData = {
  account: null | {
    connectedAt: string
    displayName: string
    profileImageUrl: string | null
    username: string
    xUserId: string
  }
  configured: boolean
  aiContentApproved: boolean
  drafts: SocialDraft[]
  mentions: SocialMention[]
  preferences: SocialStudioPreferences
}

export type SocialStudioPreferencesInput = {
  audience: string | null
  avoidTopics: string[]
  scheduleDayOfWeek: number
  scheduleEnabled: boolean
  scheduleFrequency: SocialScheduleFrequency
  scheduleTime: string
  tone: string | null
  topics: string[]
  voiceNotes: string | null
}

class SocialAPI {
  async getStudio(): Promise<SocialStudioData> {
    const { data: response } = await http.get<{ data: SocialStudioData }>(
      API_V2 + '/studio',
    )
    return response.data
  }

  async startXConnection(input: {
    disclosureAccepted: true
    returnUrl: string
  }): Promise<string> {
    const { data: response } = await http.post<{
      data: { authorizationUrl: string }
    }>(API_V2 + '/oauth/start', input)
    return response.data.authorizationUrl
  }

  async disconnectX(): Promise<void> {
    await http.delete(API_V2 + '/connection')
  }

  async updatePreferences(
    input: SocialStudioPreferencesInput,
  ): Promise<SocialStudioPreferences> {
    const { data: response } = await http.put<{
      data: SocialStudioPreferences
    }>(API_V2 + '/preferences', input)
    return response.data
  }

  async setActivitySuggestionConsent(
    accepted: boolean,
  ): Promise<SocialStudioPreferences> {
    const { data: response } = await http.put<{
      data: SocialStudioPreferences
    }>(API_V2 + '/studio/activity-consent', { accepted })
    return response.data
  }

  async refreshSuggestions(force = false): Promise<number> {
    const { data: response } = await http.post<{
      data: { generatedCount: number }
    }>(API_V2 + '/studio/suggestions/refresh', { force })
    return response.data.generatedCount
  }

  async syncMentions(): Promise<number> {
    const { data: response } = await http.post<{
      data: { syncedCount: number }
    }>(API_V2 + '/mentions/sync')
    return response.data.syncedCount
  }

  async generateDraft(input: {
    brief?: string
    type: 'POST' | 'THREAD'
  }): Promise<SocialDraft> {
    const { data: response } = await http.post<{ data: SocialDraft }>(
      API_V2 + '/drafts',
      input,
    )
    return response.data
  }

  async generateReplyDraft(mentionId: string): Promise<SocialDraft> {
    const { data: response } = await http.post<{ data: SocialDraft }>(
      API_V2 + '/mentions/' + encodeURIComponent(mentionId) + '/reply-draft',
    )
    return response.data
  }

  async updateDraft(draftId: string, segments: string[]): Promise<SocialDraft> {
    const { data: response } = await http.patch<{ data: SocialDraft }>(
      API_V2 + '/drafts/' + encodeURIComponent(draftId),
      { segments },
    )
    return response.data
  }

  async publishDraft(draftId: string): Promise<SocialDraft> {
    const { data: response } = await http.post<{ data: SocialDraft }>(
      API_V2 + '/drafts/' + encodeURIComponent(draftId) + '/publish',
    )
    return response.data
  }

  async discardDraft(draftId: string): Promise<void> {
    await http.delete(API_V2 + '/drafts/' + encodeURIComponent(draftId))
  }
}

export const socialAPI = new SocialAPI()
export const socialQueryKeys = {
  all: ['social-studio'] as const,
  studio: () => [...socialQueryKeys.all, 'studio'] as const,
}
