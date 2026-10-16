import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import {
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiRefreshLine,
  RiSettings3Line,
  RiTwitterXLine,
} from '@remixicon/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Switch } from '@/components/common/switch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useToast } from '@/providers/toast.provider'
import { colors } from '@/shared/colors.shared'
import {
  socialAPI,
  socialQueryKeys,
  type SocialDraft,
  type SocialDraftType,
  type SocialScheduleFrequency,
  type SocialStudioPreferences,
  type SocialStudioPreferencesInput,
} from '@/shared/api/social.api'

const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
] as const

type PreferenceFormState = {
  audience: string
  avoidTopics: string
  scheduleDayOfWeek: number
  scheduleEnabled: boolean
  scheduleFrequency: SocialScheduleFrequency
  scheduleTime: string
  tone: string
  topics: string
  voiceNotes: string
}

function createPreferenceForm(
  preferences: SocialStudioPreferences,
): PreferenceFormState {
  return {
    audience: preferences.audience ?? '',
    avoidTopics: preferences.avoidTopics.join('\n'),
    scheduleDayOfWeek: preferences.scheduleDayOfWeek,
    scheduleEnabled: preferences.scheduleEnabled,
    scheduleFrequency: preferences.scheduleFrequency,
    scheduleTime: preferences.scheduleTime,
    tone: preferences.tone ?? '',
    topics: preferences.topics.join('\n'),
    voiceNotes: preferences.voiceNotes ?? '',
  }
}

function toPreferencesInput(
  state: PreferenceFormState,
): SocialStudioPreferencesInput {
  const parseList = (value: string): string[] =>
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20)

  return {
    audience: state.audience.trim() || null,
    avoidTopics: parseList(state.avoidTopics),
    scheduleDayOfWeek: state.scheduleDayOfWeek,
    scheduleEnabled: state.scheduleEnabled,
    scheduleFrequency: state.scheduleFrequency,
    scheduleTime: state.scheduleTime,
    tone: state.tone.trim() || null,
    topics: parseList(state.topics),
    voiceNotes: state.voiceNotes.trim() || null,
  }
}

function draftTypeLabel(type: SocialDraftType): string {
  if (type === 'THREAD') return 'Thread'
  if (type === 'REPLY') return 'Reply'
  return 'Post'
}

function draftStatusLabel(draft: SocialDraft): string {
  switch (draft.status) {
    case 'PUBLISHED':
      return 'Published'
    case 'PARTIALLY_PUBLISHED':
      return 'Part of this thread was published'
    case 'PUBLISH_FAILED':
      return 'X did not confirm publication'
    case 'PUBLISHING':
      return 'Publishing'
    case 'DISCARDED':
      return 'Removed'
    case 'DRAFT':
      return 'Needs your review'
  }
}

function draftStatusClassName(draft: SocialDraft): string {
  switch (draft.status) {
    case 'DRAFT':
      return 'bg-cardx text-studio-info-ink'
    case 'PARTIALLY_PUBLISHED':
    case 'PUBLISH_FAILED':
      return 'bg-cardx text-studio-warning-ink'
    case 'PUBLISHING':
      return 'bg-cardx text-studio-action-ink'
    case 'PUBLISHED':
    case 'DISCARDED':
      return 'bg-cardx text-card-lighter-3'
  }
}

function publishButtonLabel(type: SocialDraftType): string {
  if (type === 'THREAD') return 'Publish thread'
  if (type === 'REPLY') return 'Publish reply'
  return 'Publish to X'
}

function parseDraftSegments(value: string): string[] {
  return value
    .split('\n\n')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function SocialDraftEditorSheet({
  draft,
  onClose,
  onSave,
}: {
  draft: SocialDraft
  onClose: () => void
  onSave: (segments: string[]) => Promise<void>
}) {
  const [value, setValue] = useState(draft.segments.join('\n\n'))
  const [isSaving, setIsSaving] = useState(false)
  const segments =
    draft.type === 'THREAD' ? parseDraftSegments(value) : [value.trim()]

  async function handleSave(): Promise<void> {
    setIsSaving(true)
    try {
      await onSave(segments)
    } catch {
      return
    } finally {
      setIsSaving(false)
    }
    onClose()
  }

  return (
    <View className="gap-4 pb-2">
      <Text className="text-sm leading-5 text-card-lighter-3">
        {draft.type === 'THREAD'
          ? 'Keep one post per paragraph. Each part must fit X’s post limit.'
          : 'Make it sound right before you decide whether to publish.'}
      </Text>
      <TextArea
        aria-label={
          draft.type === 'THREAD'
            ? 'Edit thread segments, separated by a blank line'
            : 'Edit draft text'
        }
        className="!bg-cardx placeholder:!text-card-lighter-3"
        onChange={(event) => setValue(event.currentTarget.value)}
        rows={draft.type === 'THREAD' ? 8 : 5}
        value={value}
      />
      <View className="grid grid-cols-2 gap-2">
        <Button
          buttonClassName="w-full"
          className="!w-full !px-2"
          bgColor={colors.cardx}
          disabled={
            isSaving ||
            segments.length === 0 ||
            segments.some((segment) => !segment.trim())
          }
          label="Save changes"
          loading={isSaving}
          onClick={() => void handleSave()}
          textClassName="!whitespace-nowrap !text-center !text-studio-action-ink"
        />
        <Pressable
          accessibilityLabel="Cancel draft editing"
          className="min-h-11 w-full items-center justify-center rounded-full bg-cardx px-4"
          disabled={isSaving}
          onPress={onClose}
        >
          <Text className="text-center text-sm font-semibold text-white">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const PREFERENCE_PANES = [
  {
    accessibilityLabel: 'Writing voice settings',
    label: 'Voice',
    value: 'voice',
  },
  {
    accessibilityLabel: 'Topics settings',
    label: 'Topics',
    value: 'topics',
  },
  {
    accessibilityLabel: 'Draft schedule settings',
    label: 'Schedule',
    value: 'schedule',
  },
] as const

type PreferencesPane = (typeof PREFERENCE_PANES)[number]['value']

function SocialPreferencesSheet({
  initialPreferences,
  onClose,
  onSave,
}: {
  initialPreferences: SocialStudioPreferences
  onClose: () => void
  onSave: (preferences: SocialStudioPreferencesInput) => Promise<void>
}) {
  const [form, setForm] = useState(() =>
    createPreferenceForm(initialPreferences),
  )
  const [pane, setPane] = useState<PreferencesPane>('voice')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(): Promise<void> {
    setIsSaving(true)
    try {
      await onSave(toPreferencesInput(form))
    } catch {
      // The mutation reports its error through the screen's toast handler.
      return
    } finally {
      setIsSaving(false)
    }
    onClose()
  }

  return (
    <View className="gap-5 pb-2">
      <View className="flex-row rounded-2xl bg-cardx p-1">
        {PREFERENCE_PANES.map(({ accessibilityLabel, label, value }) => {
          const selected = pane === value
          return (
            <Pressable
              key={value}
              accessibilityLabel={accessibilityLabel}
              aria-pressed={selected}
              className={
                'min-h-11 flex-1 items-center justify-center rounded-xl px-3 ' +
                (selected ? 'bg-white' : '')
              }
              onPress={() => setPane(value)}
            >
              <Text
                className={
                  'text-center text-sm font-semibold ' +
                  (selected ? 'text-black' : 'text-white')
                }
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {pane === 'voice' ? (
        <View className="gap-4">
          <Text className="text-sm leading-6 text-card-lighter-3">
            These preferences shape drafts. Rewind and activity context has a
            separate opt-in you can change in X account settings.
          </Text>
          <label className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-white">Tone</Text>
            <TextArea
              aria-label="Writing tone"
              className="!bg-cardx placeholder:!text-card-lighter-3"
              onChange={(event) =>
                setForm({ ...form, tone: event.currentTarget.value })
              }
              placeholder="Direct, thoughtful, a little playful…"
              rows={2}
              value={form.tone}
            />
          </label>
          <label className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-white">
              Voice notes
            </Text>
            <TextArea
              aria-label="Voice notes"
              className="!bg-cardx placeholder:!text-card-lighter-3"
              onChange={(event) =>
                setForm({ ...form, voiceNotes: event.currentTarget.value })
              }
              placeholder="How should a post sound like you?"
              rows={3}
              value={form.voiceNotes}
            />
          </label>
          <label className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-white">Audience</Text>
            <TextArea
              aria-label="Audience"
              className="!bg-cardx placeholder:!text-card-lighter-3"
              onChange={(event) =>
                setForm({ ...form, audience: event.currentTarget.value })
              }
              placeholder="Who do you usually want to reach?"
              rows={2}
              value={form.audience}
            />
          </label>
        </View>
      ) : null}

      {pane === 'topics' ? (
        <View className="gap-4">
          <label className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-white">
              Topics to write about
            </Text>
            <TextArea
              aria-label="Topics to write about, one per line"
              className="!bg-cardx placeholder:!text-card-lighter-3"
              onChange={(event) =>
                setForm({ ...form, topics: event.currentTarget.value })
              }
              placeholder={'Product design\nBuilding in public'}
              rows={3}
              value={form.topics}
            />
          </label>
          <label className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-white">
              Topics to avoid
            </Text>
            <TextArea
              aria-label="Topics to avoid, one per line"
              className="!bg-cardx placeholder:!text-card-lighter-3"
              onChange={(event) =>
                setForm({ ...form, avoidTopics: event.currentTarget.value })
              }
              placeholder={'Politics\nClient details'}
              rows={2}
              value={form.avoidTopics}
            />
          </label>
        </View>
      ) : null}

      {pane === 'schedule' ? (
        <View className="gap-5">
          <View className="flex-row items-center justify-between gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-sm font-semibold text-white">
                Create a draft on a schedule
              </Text>
              <Text className="text-sm leading-6 text-card-lighter-3">
                One draft only. It will never publish by itself.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Create a social draft on a schedule"
              checked={form.scheduleEnabled}
              onChange={(scheduleEnabled) =>
                setForm({ ...form, scheduleEnabled })
              }
            />
          </View>
          {form.scheduleEnabled ? (
            <View className="gap-5">
              <View className="flex-row gap-3">
                {(['WEEKLY', 'DAILY'] as const).map((frequency) => {
                  const selected = form.scheduleFrequency === frequency
                  return (
                    <Pressable
                      key={frequency}
                      accessibilityLabel={
                        frequency === 'WEEKLY'
                          ? 'Weekly draft schedule'
                          : 'Daily draft schedule'
                      }
                      aria-pressed={selected}
                      className={
                        'min-h-11 flex-1 items-center justify-center rounded-full px-4 ' +
                        (selected ? 'bg-white' : 'bg-cardx')
                      }
                      onPress={() =>
                        setForm({ ...form, scheduleFrequency: frequency })
                      }
                    >
                      <Text
                        className={
                          'text-center text-sm font-semibold ' +
                          (selected ? 'text-black' : 'text-white')
                        }
                      >
                        {frequency === 'WEEKLY' ? 'Weekly' : 'Daily'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {form.scheduleFrequency === 'WEEKLY' ? (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-white">Day</Text>
                  <View className="flex-row justify-between gap-1">
                    {WEEKDAYS.map((day) => {
                      const selected = form.scheduleDayOfWeek === day.value
                      return (
                        <Pressable
                          key={day.value}
                          accessibilityLabel={
                            day.label + ' for scheduled draft'
                          }
                          aria-pressed={selected}
                          className={
                            'min-h-11 min-w-10 flex-1 items-center justify-center rounded-full ' +
                            (selected ? 'bg-white' : 'bg-cardx')
                          }
                          onPress={() =>
                            setForm({ ...form, scheduleDayOfWeek: day.value })
                          }
                        >
                          <Text
                            className={
                              'text-center text-xs font-semibold ' +
                              (selected ? 'text-black' : 'text-white')
                            }
                          >
                            {day.label.slice(0, 1)}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              ) : null}
              <label className="flex flex-col gap-2">
                <Text className="text-sm font-semibold text-white">
                  Time in your local timezone
                </Text>
                <input
                  aria-label="Scheduled draft time"
                  className="min-h-11 rounded-xl bg-cardx px-4 text-sm text-white"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      scheduleTime: event.currentTarget.value,
                    })
                  }
                  type="time"
                  value={form.scheduleTime}
                />
              </label>
            </View>
          ) : null}
        </View>
      ) : null}

      <Button
        buttonClassName="w-full"
        className="!w-full !px-5"
        bgColor={colors.cardx}
        disabled={isSaving}
        fullWidth
        label="Save preferences"
        loading={isSaving}
        onClick={() => void handleSave()}
        textClassName="!text-studio-action-ink"
      />
    </View>
  )
}

function SocialDataUseSheet() {
  return (
    <View className="gap-4 pb-2">
      <Text className="text-sm leading-6 text-card-lighter-3">
        Personalized suggestions can use up to three recent completed Rewind
        summaries, completed goal progress and achievements, your writing
        preferences, up to 10 recent original X posts, and recent X mentions.
        Selected context is sent to OpenRouter for generation with privacy mode
        enabled.
      </Text>
      <Text className="text-sm leading-6 text-card-lighter-3">
        Journal text, private Rewind chats, partner-relationship data, balances,
        and missed-goal events are excluded. Suggestions remain private and
        never publish automatically. Review each one before publishing. Synced
        mentions and replies expire within 23 hours; disconnect to remove them
        sooner. You can turn off activity-based suggestions in X account
        settings.
      </Text>
    </View>
  )
}

function SocialAccountSheet({
  username,
  activitySuggestionsEnabled,
  onDisconnect,
  onSetActivitySuggestions,
  onEditPreferences,
  onViewDataUse,
  onClose,
}: {
  username: string
  activitySuggestionsEnabled: boolean
  onDisconnect: () => Promise<void>
  onSetActivitySuggestions: (enabled: boolean) => Promise<void>
  onEditPreferences: () => void
  onViewDataUse: () => void
  onClose: () => void
}) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSavingActivityConsent, setIsSavingActivityConsent] = useState(false)
  const [activityEnabled, setActivityEnabled] = useState(
    activitySuggestionsEnabled,
  )

  async function handleDisconnect(): Promise<void> {
    if (
      !confirm(
        'Disconnect X from Vybaa? Your saved drafts and synced mentions will be removed.',
      )
    ) {
      return
    }

    setIsDisconnecting(true)
    try {
      await onDisconnect()
    } catch {
      // Keep the sheet open so the user can retry after the mutation's toast.
      return
    } finally {
      setIsDisconnecting(false)
    }
    onClose()
  }

  async function handleActivityConsentChange(enabled: boolean): Promise<void> {
    setActivityEnabled(enabled)
    setIsSavingActivityConsent(true)
    try {
      await onSetActivitySuggestions(enabled)
    } catch {
      setActivityEnabled(!enabled)
      return
    } finally {
      setIsSavingActivityConsent(false)
    }
  }

  return (
    <View className="gap-4 pb-2">
      <Text className="text-sm leading-6 text-card-lighter-3">
        Connected as{' '}
        <span className="font-semibold text-white">@{username}</span>. Drafts
        stay private until you choose to publish them. Synced mentions and reply
        drafts expire within 23 hours.
      </Text>
      <View className="gap-3 py-2">
        <View className="flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-sm font-semibold text-white">
              Rewind-powered suggestions
            </Text>
            <Text className="text-sm leading-5 text-card-lighter-3">
              Use recent Rewind summaries and completed milestones to shape
              private post ideas.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Use Rewind summaries and milestones for X suggestions"
            checked={activityEnabled}
            disabled={isSavingActivityConsent}
            onChange={(enabled) => void handleActivityConsentChange(enabled)}
          />
        </View>
        <Text className="text-xs leading-5 text-card-lighter-3">
          Journals, private chats, relationship data, balances, and missed
          events are not used. Turning this off stops future activity-based
          generation; existing drafts remain yours to review or remove.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="View how suggestion data is used"
        className="min-h-11 flex-row items-center justify-between gap-3 py-2"
        onPress={onViewDataUse}
      >
        <Text className="text-sm font-semibold text-white">
          How suggestions use your data
        </Text>
        <RiArrowRightSLine className="shrink-0 text-white" size={20} />
      </Pressable>
      <Pressable
        accessibilityLabel="Edit writing voice and draft schedule"
        className="min-h-14 flex-row items-center justify-between gap-3 py-2"
        onPress={onEditPreferences}
      >
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-sm font-semibold text-white">
            Writing preferences
          </Text>
          <Text className="text-sm text-card-lighter-3">
            Voice, topics, and draft schedule
          </Text>
        </View>
        <RiArrowRightSLine className="shrink-0 text-white" size={20} />
      </Pressable>
      <Pressable
        accessibilityLabel="Disconnect X account"
        className="min-h-11 items-center justify-center self-start rounded-full bg-cardx px-5"
        disabled={isDisconnecting}
        onPress={() => void handleDisconnect()}
      >
        <Text className="text-sm font-semibold text-white">
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect X'}
        </Text>
      </Pressable>
    </View>
  )
}

export default function SocialStudioScreen({
  oauthStatus,
}: {
  oauthStatus?: 'connected' | 'failed'
}) {
  const bottomSheet = useBottomSheetController()
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [disclosureAccepted, setDisclosureAccepted] = useState(false)
  const [activeTab, setActiveTab] = useState<'for-you' | 'replies' | 'history'>(
    'for-you',
  )
  const suggestionRefreshConsent = useRef<string | null>(null)

  const studioQuery = useQuery({
    queryKey: socialQueryKeys.studio(),
    queryFn: socialAPI.getStudio,
    refetchOnMount: 'always',
  })
  const studio = studioQuery.data

  useEffect(() => {
    if (!oauthStatus) return
    if (oauthStatus === 'connected') {
      toast.success('X is connected')
      void queryClient.invalidateQueries({ queryKey: socialQueryKeys.studio() })
    } else {
      toast.error('X connection was not completed')
    }
    void navigate({ replace: true, search: {}, to: '/app/social' })
  }, [navigate, oauthStatus, queryClient, toast])

  const refreshStudio = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: socialQueryKeys.studio() })
  }

  const preferencesMutation = useMutation({
    mutationFn: socialAPI.updatePreferences,
    onError: (error: Error) => {
      toast.error(error.message || 'Could not save your writing preferences')
    },
    onSuccess: async () => {
      await refreshStudio()
      toast.success('Social preferences saved')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: socialAPI.disconnectX,
    onError: (error: Error) => {
      toast.error(error.message || 'Could not disconnect X')
    },
    onSuccess: async () => {
      setDisclosureAccepted(false)
      await refreshStudio()
      toast.success('X was disconnected from Vybaa')
    },
  })

  const activityConsentMutation = useMutation({
    mutationFn: socialAPI.setActivitySuggestionConsent,
    onError: (error: Error) => {
      toast.error(error.message || 'Could not update suggestion privacy')
    },
    onSuccess: async (_preferences, accepted) => {
      await refreshStudio()
      toast.success(
        accepted
          ? 'Rewind-powered suggestions are on'
          : 'Rewind-powered suggestions are off',
      )
    },
  })

  const refreshSuggestionsMutation = useMutation({
    mutationFn: socialAPI.refreshSuggestions,
    onSuccess: async () => {
      await refreshStudio()
    },
  })

  const saveDraftMutation = useMutation({
    mutationFn: ({
      draftId,
      segments,
    }: {
      draftId: string
      segments: string[]
    }) => socialAPI.updateDraft(draftId, segments),
    onError: (error: Error) => {
      toast.error(error.message || 'Could not save this draft')
    },
    onSuccess: async () => {
      await refreshStudio()
      toast.success('Draft saved')
    },
  })

  const publishDraftMutation = useMutation({
    mutationFn: socialAPI.publishDraft,
    onError: async (error: Error) => {
      await refreshStudio()
      toast.error(error.message || 'Could not publish this draft')
    },
    onSuccess: async () => {
      await refreshStudio()
      toast.success('Published to X')
    },
  })

  const discardDraftMutation = useMutation({
    mutationFn: socialAPI.discardDraft,
    onError: (error: Error) => {
      toast.error(error.message || 'Could not remove this draft')
    },
    onSuccess: async () => {
      await refreshStudio()
      toast.success('Removed from Social Studio')
    },
  })

  useEffect(() => {
    const consentAt = studio?.preferences.activitySuggestionConsentAt
    if (
      !studio?.account ||
      !studio.aiContentApproved ||
      !studio.preferences.aiDraftingConsentAt ||
      !consentAt ||
      suggestionRefreshConsent.current === consentAt
    ) {
      return
    }
    suggestionRefreshConsent.current = consentAt
    refreshSuggestionsMutation.mutate(false)
  }, [refreshSuggestionsMutation, studio])

  async function handleConnect(): Promise<void> {
    if (!disclosureAccepted) return

    try {
      const returnUrl = Capacitor.isNativePlatform()
        ? 'vybaa://app/social'
        : window.location.origin + '/app/social'
      const authorizationUrl = await socialAPI.startXConnection({
        disclosureAccepted: true,
        returnUrl,
      })
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          presentationStyle: 'fullscreen',
          url: authorizationUrl,
        })
      } else {
        window.location.assign(authorizationUrl)
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Could not start X connection',
      )
    }
  }

  async function handleCopyDraft(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied. Open X and post it when you are ready.')
    } catch {
      toast.error('Could not copy this text on your device')
    }
  }

  function openPreferencesSheet(): void {
    if (!studio) return
    bottomSheet.present(
      <SocialPreferencesSheet
        initialPreferences={studio.preferences}
        onClose={bottomSheet.dismiss}
        onSave={async (input) => {
          await preferencesMutation.mutateAsync(input)
        }}
      />,
      { size: 'semi-full', title: 'Writing preferences' },
    )
  }

  function openAccountSheet(): void {
    if (!studio?.account) return
    bottomSheet.present(
      <SocialAccountSheet
        username={studio.account.username}
        activitySuggestionsEnabled={Boolean(
          studio.preferences.activitySuggestionConsentAt,
        )}
        onEditPreferences={openPreferencesSheet}
        onDisconnect={async () => {
          await disconnectMutation.mutateAsync()
        }}
        onSetActivitySuggestions={async (enabled) => {
          await activityConsentMutation.mutateAsync(enabled)
        }}
        onViewDataUse={openDataUseSheet}
        onClose={bottomSheet.dismiss}
      />,
      { title: 'X account' },
    )
  }

  function openDataUseSheet(): void {
    bottomSheet.present(<SocialDataUseSheet />, {
      title: 'How suggestions use your data',
    })
  }

  function openDraftEditor(draft: SocialDraft): void {
    bottomSheet.present(
      <SocialDraftEditorSheet
        draft={draft}
        onClose={bottomSheet.dismiss}
        onSave={async (segments) => {
          await saveDraftMutation.mutateAsync({
            draftId: draft.id,
            segments,
          })
        }}
      />,
      { size: 'semi-full', title: 'Edit X draft' },
    )
  }

  async function handleRefreshSuggestions(): Promise<void> {
    try {
      const generatedCount = await refreshSuggestionsMutation.mutateAsync(true)
      toast.success(
        generatedCount === 1
          ? 'One new idea is ready'
          : generatedCount > 1
            ? `${generatedCount} new ideas are ready`
            : 'Your ideas are up to date',
      )
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not refresh suggestions',
      )
    }
  }

  function handlePublish(draft: SocialDraft): void {
    if (
      !confirm(
        'Publish this ' +
          draftTypeLabel(draft.type).toLowerCase() +
          ' to X now? You can still edit it before publishing.',
      )
    ) {
      return
    }
    publishDraftMutation.mutate(draft.id)
  }

  function handleDiscard(draft: SocialDraft): void {
    if (!confirm('Remove this item from Social Studio?')) return
    discardDraftMutation.mutate(draft.id)
  }

  if (studioQuery.isLoading || !studio) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Social Studio" />
          <View className="flex-1 items-center justify-center px-8 pb-24">
            <Text className="text-sm text-card-lighter-3">
              {studioQuery.isError
                ? 'Social Studio could not load. Check your connection and try again.'
                : 'Loading Social Studio…'}
            </Text>
            {studioQuery.isError ? (
              <Pressable
                accessibilityLabel="Try loading Social Studio again"
                className="mt-5 min-h-11 items-center justify-center rounded-full bg-cardx px-5"
                onPress={() => {
                  void studioQuery.refetch()
                }}
              >
                <Text className="text-sm font-semibold text-white">
                  Try again
                </Text>
              </Pressable>
            ) : null}
          </View>
        </NoiseComponent>
      </View>
    )
  }

  const visibleDrafts = studio.drafts.filter((draft) => {
    if (activeTab === 'for-you') {
      return draft.status === 'DRAFT' && draft.type !== 'REPLY'
    }
    if (activeTab === 'replies') {
      return draft.status === 'DRAFT' && draft.type === 'REPLY'
    }
    return draft.status !== 'DRAFT'
  })

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Social Studio" />
        <View className="no-scrollbar flex-1 overflow-y-auto">
          <View className="gap-6 px-mg pb-[150px]">
            {!studio.account ? (
              <View className="gap-5">
                <View className="gap-2">
                  <RiTwitterXLine
                    className="mb-2 text-studio-action-ink"
                    size={24}
                  />
                  <Text className="text-2xl font-bold leading-8 text-white">
                    Ideas for X, shaped by your real progress.
                  </Text>
                  <Text className="text-base leading-6 text-card-lighter-3">
                    See post and reply ideas informed by Rewinds, milestones,
                    and your X activity. Nothing goes live without your review.
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Learn how Vybaa uses X content"
                  className="min-h-11 flex-row items-center justify-between gap-3 py-2"
                  onPress={openDataUseSheet}
                >
                  <Text className="text-sm font-semibold text-studio-action-ink">
                    How your X data is used
                  </Text>
                  <RiArrowRightSLine
                    className="text-studio-action-ink"
                    size={20}
                  />
                </Pressable>

                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
                  <input
                    aria-label="I agree to use Rewind summaries, milestones, and recent X content for suggestions"
                    checked={disclosureAccepted}
                    className="mt-1 size-5 shrink-0 accent-white"
                    onChange={(event) =>
                      setDisclosureAccepted(event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <Text className="text-sm leading-6 text-white">
                    I agree to use recent Rewind summaries, completed goal or
                    achievement milestones, my preferences, recent public X
                    posts, and mentions for private AI suggestions. Journals and
                    private chats are excluded. I choose what gets published.
                  </Text>
                </label>

                {!studio.configured ? (
                  <Text className="text-sm leading-6 text-card-lighter-3">
                    Connect X after configuring a Developer app, OAuth 2.0
                    callback, and server-side encryption key.
                  </Text>
                ) : null}

                <Button
                  buttonClassName="w-full"
                  className="!w-full !px-5"
                  bgColor={colors.cardx}
                  disabled={!studio.configured || !disclosureAccepted}
                  fullWidth
                  label="Continue with X"
                  loading={false}
                  onClick={() => {
                    void handleConnect()
                  }}
                  rightIcon={
                    <RiArrowRightSLine
                      className="text-studio-action-ink"
                      size={18}
                    />
                  }
                  textClassName="!text-studio-action-ink"
                />
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between gap-4">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-sm font-semibold text-white">
                      @{studio.account.username}
                    </Text>
                    <Text className="text-sm leading-5 text-card-lighter-3">
                      Ideas are private until you choose to publish
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="X account settings"
                    className="min-h-11 shrink-0 flex-row items-center justify-center gap-2 rounded-full bg-cardx px-4"
                    onPress={openAccountSheet}
                  >
                    <RiSettings3Line className="text-white" size={19} />
                    <Text className="text-sm font-semibold text-white">
                      Settings
                    </Text>
                  </Pressable>
                </View>

                <View
                  className="flex-row rounded-2xl bg-cardx p-1"
                  role="group"
                  aria-label="Social Studio sections"
                >
                  {(
                    [
                      ['for-you', 'For you'],
                      ['replies', 'Replies'],
                      ['history', 'History'],
                    ] as const
                  ).map(([tab, label]) => {
                    const selected = activeTab === tab
                    const itemCount =
                      tab === 'for-you'
                        ? studio.drafts.filter(
                            (draft) =>
                              draft.status === 'DRAFT' &&
                              draft.type !== 'REPLY',
                          ).length
                        : tab === 'replies'
                          ? studio.drafts.filter(
                              (draft) =>
                                draft.status === 'DRAFT' &&
                                draft.type === 'REPLY',
                            ).length
                          : studio.drafts.filter(
                              (draft) => draft.status !== 'DRAFT',
                            ).length
                    return (
                      <Pressable
                        key={tab}
                        accessibilityLabel={`${label}, ${itemCount}`}
                        aria-pressed={selected}
                        className={
                          'min-h-11 min-w-0 flex-1 flex-row items-center justify-center gap-1 rounded-xl px-2 ' +
                          (selected ? 'bg-white' : '')
                        }
                        onPress={() => setActiveTab(tab)}
                      >
                        <Text
                          className={
                            'whitespace-nowrap text-center text-sm font-semibold ' +
                            (selected ? 'text-black' : 'text-white')
                          }
                        >
                          {label}
                        </Text>
                        {itemCount ? (
                          <Text
                            className={
                              'text-xs font-semibold ' +
                              (selected ? 'text-black' : 'text-card-lighter-3')
                            }
                          >
                            {itemCount}
                          </Text>
                        ) : null}
                      </Pressable>
                    )
                  })}
                </View>

                {activeTab !== 'history' ? (
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between gap-3 px-1">
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="text-lg font-semibold text-white">
                          {activeTab === 'for-you'
                            ? 'Ideas for you'
                            : 'Reply ideas'}
                        </Text>
                        <Text className="text-sm leading-6 text-card-lighter-3">
                          {activeTab === 'for-you'
                            ? 'A short list shaped by recent Rewinds and app progress.'
                            : 'Thoughtful replies to recent X mentions, ready for your review.'}
                        </Text>
                      </View>
                      {studio.aiContentApproved &&
                      studio.preferences.activitySuggestionConsentAt ? (
                        <Pressable
                          accessibilityLabel="Refresh personalized X suggestions"
                          className="min-h-11 shrink-0 flex-row items-center justify-center gap-2 rounded-full bg-cardx px-4"
                          disabled={refreshSuggestionsMutation.isPending}
                          onPress={() => void handleRefreshSuggestions()}
                        >
                          <RiRefreshLine
                            className={
                              refreshSuggestionsMutation.isPending
                                ? 'animate-spin text-studio-action-ink'
                                : 'text-studio-action-ink'
                            }
                            size={16}
                          />
                          <Text className="text-center text-sm font-semibold text-studio-action-ink">
                            Refresh
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {!studio.aiContentApproved ? (
                      <View className="flex-row items-start gap-2 rounded-xl bg-cardx px-3 py-2.5">
                        <RiInformationLine
                          className="mt-0.5 shrink-0 text-studio-info-ink"
                          size={17}
                        />
                        <Text className="flex-1 text-sm leading-5 text-studio-info-ink">
                          Suggestions are waiting for X approval of this AI
                          feature.
                        </Text>
                      </View>
                    ) : null}
                    {!studio.preferences.activitySuggestionConsentAt ? (
                      <View className="gap-2 rounded-xl bg-cardx p-3">
                        <Text className="text-sm leading-5 text-studio-info-ink">
                          Turn on Rewind-powered suggestions once. You will not
                          need to write or select a topic to get ideas.
                        </Text>
                        <Pressable
                          accessibilityLabel="Set privacy for personalized X suggestions"
                          className="min-h-11 self-start items-center justify-center rounded-full bg-cardx px-5"
                          onPress={openAccountSheet}
                        >
                          <Text className="text-center text-sm font-semibold text-studio-action-ink">
                            Choose suggestion privacy
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {refreshSuggestionsMutation.isPending ? (
                      <Text
                        aria-live="polite"
                        className="text-sm text-card-lighter-3"
                      >
                        Finding ideas from your recent activity…
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {activeTab === 'history' ? (
                  <View className="gap-2 px-1">
                    <Text className="text-lg font-semibold text-white">
                      Past activity
                    </Text>
                    <Text className="text-sm leading-6 text-card-lighter-3">
                      Published posts and drafts that need another look.
                    </Text>
                  </View>
                ) : null}

                <View className="gap-4">
                  {visibleDrafts.length ? (
                    <View className="gap-3">
                      {visibleDrafts.map((draft) => {
                        const sourceMention = draft.sourceMentionId
                          ? studio.mentions.find(
                              (mention) => mention.id === draft.sourceMentionId,
                            )
                          : undefined
                        const canEdit = draft.status === 'DRAFT'
                        const canPublish = canEdit && studio.aiContentApproved
                        const isBusy =
                          saveDraftMutation.isPending ||
                          publishDraftMutation.isPending ||
                          discardDraftMutation.isPending
                        return (
                          <View key={draft.id} className="gap-4 py-4">
                            <View className="flex-row items-center justify-between gap-3">
                              <View className="flex-row flex-wrap items-center gap-2">
                                <Text className="text-sm font-semibold text-white">
                                  {draftTypeLabel(draft.type)}
                                </Text>
                                <Text
                                  className={
                                    'rounded-full px-2.5 py-1 text-xs font-semibold ' +
                                    draftStatusClassName(draft)
                                  }
                                >
                                  {draftStatusLabel(draft)}
                                </Text>
                              </View>
                              {draft.status !== 'PUBLISHING' ? (
                                <Pressable
                                  accessibilityLabel="Remove draft"
                                  className="min-h-11 min-w-11 items-center justify-center rounded-full bg-cardx"
                                  disabled={isBusy}
                                  onPress={() => handleDiscard(draft)}
                                >
                                  <RiDeleteBinLine
                                    className="text-card-lighter-3"
                                    size={17}
                                  />
                                </Pressable>
                              ) : null}
                            </View>

                            {draft.sourceLabel ? (
                              <Text className="text-xs font-semibold text-card-lighter-3">
                                {draft.sourceLabel}
                              </Text>
                            ) : null}
                            {draft.sourceReason ? (
                              <View className="flex-row items-start gap-2 py-1">
                                <RiInformationLine
                                  className="mt-0.5 shrink-0 text-studio-info-ink"
                                  size={16}
                                />
                                <Text className="flex-1 text-sm leading-5 text-card-lighter-3">
                                  Why it fits: {draft.sourceReason}
                                </Text>
                              </View>
                            ) : null}
                            {sourceMention ? (
                              <View className="gap-1 py-1">
                                <Text className="text-xs font-semibold text-card-lighter-3">
                                  Replying to @{sourceMention.authorUsername}
                                </Text>
                                <Text className="text-sm leading-5 text-card-lighter-3">
                                  {sourceMention.text}
                                </Text>
                              </View>
                            ) : null}

                            <View className="gap-3">
                              {draft.segments.map((segment, index) => (
                                <View
                                  key={draft.id + '-' + index}
                                  className="gap-1"
                                >
                                  {draft.type === 'THREAD' ? (
                                    <Text className="text-sm font-semibold text-card-lighter-3">
                                      {index + 1} / {draft.segments.length}
                                    </Text>
                                  ) : null}
                                  <Text className="whitespace-pre-wrap text-sm leading-6 text-white">
                                    {segment}
                                  </Text>
                                  {canEdit && !studio.aiContentApproved ? (
                                    <Pressable
                                      accessibilityLabel={
                                        'Copy ' +
                                        draftTypeLabel(
                                          draft.type,
                                        ).toLowerCase() +
                                        ' segment ' +
                                        (index + 1)
                                      }
                                      className="min-h-11 items-center justify-center self-start rounded-full bg-cardx px-4"
                                      onPress={() => {
                                        void handleCopyDraft(segment)
                                      }}
                                    >
                                      <Text className="text-center text-sm font-semibold text-studio-action-ink">
                                        Copy segment
                                      </Text>
                                    </Pressable>
                                  ) : null}
                                </View>
                              ))}
                            </View>

                            {draft.status === 'PUBLISHED' ? (
                              <View className="gap-2">
                                {draft.publishedTweetIds.map((tweetId) => (
                                  <a
                                    key={tweetId}
                                    className="min-h-11 self-start py-2 text-sm font-semibold text-studio-action-ink underline"
                                    href={
                                      'https://x.com/i/status/' +
                                      encodeURIComponent(tweetId)
                                    }
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    Open published post
                                  </a>
                                ))}
                              </View>
                            ) : null}

                            {canEdit ? (
                              <View className="grid w-full grid-cols-2 gap-2">
                                <Pressable
                                  accessibilityLabel="Edit draft before publishing"
                                  className={
                                    'min-h-11 items-center justify-center rounded-full bg-cardx px-4 ' +
                                    (canPublish
                                      ? 'w-full'
                                      : 'col-span-2 w-full')
                                  }
                                  disabled={saveDraftMutation.isPending}
                                  onPress={() => openDraftEditor(draft)}
                                >
                                  <Text className="text-center text-sm font-semibold text-white">
                                    Edit
                                  </Text>
                                </Pressable>
                                {canPublish ? (
                                  <Button
                                    aria-label={publishButtonLabel(draft.type)}
                                    buttonClassName="w-full"
                                    className="!w-full !px-2"
                                    bgColor={colors.cardx}
                                    disabled={publishDraftMutation.isPending}
                                    label="Publish"
                                    loading={publishDraftMutation.isPending}
                                    onClick={() => handlePublish(draft)}
                                    textClassName="!whitespace-nowrap !text-center !text-studio-action-ink"
                                  />
                                ) : null}
                              </View>
                            ) : null}

                            {draft.status === 'PARTIALLY_PUBLISHED' ? (
                              <View className="flex-row items-start gap-2 rounded-xl bg-cardx px-3 py-2.5">
                                <RiErrorWarningLine
                                  className="mt-0.5 shrink-0 text-studio-warning-ink"
                                  size={17}
                                />
                                <Text className="flex-1 text-sm leading-5 text-studio-warning-ink">
                                  Check the thread on X before posting anything
                                  else. Vybaa will not retry it automatically.
                                </Text>
                              </View>
                            ) : null}
                            {draft.status === 'PUBLISH_FAILED' ? (
                              <View className="flex-row items-start gap-2 rounded-xl bg-cardx px-3 py-2.5">
                                <RiErrorWarningLine
                                  className="mt-0.5 shrink-0 text-studio-warning-ink"
                                  size={17}
                                />
                                <Text className="flex-1 text-sm leading-5 text-studio-warning-ink">
                                  Check X before trying this content again.
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        )
                      })}
                    </View>
                  ) : (
                    <View className="py-5">
                      <Text className="text-sm leading-6 text-card-lighter-3">
                        {activeTab === 'history'
                          ? 'Published posts and drafts needing attention will appear here.'
                          : activeTab === 'replies'
                            ? refreshSuggestionsMutation.isPending
                              ? 'Checking recent mentions and shaping replies…'
                              : 'No reply feels right yet. New replies will appear here when a recent mention is a good fit.'
                            : refreshSuggestionsMutation.isPending
                              ? 'Looking for a useful idea in your recent activity…'
                              : 'No fresh post idea just yet. A completed Rewind or milestone may give Vybaa something worth sharing.'}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
