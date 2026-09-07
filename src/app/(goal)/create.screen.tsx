import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { CreateGoalSheet } from '@/components/custom/goal/create-goal-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useToast } from '@/providers/toast.provider'
import {
  goalAPI,
  type CreateGoalRequest,
  type QuickGoalSetupAnswer,
  type QuickGoalSetupDraft,
  type QuickGoalSetupEdit,
} from '@/shared/api/goal.api'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import {
  RiArrowLeftLine,
  RiLoader4Line,
  RiSparkling2Line,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export type GoalDraftNavigation = {
  initialStep?: 1 | 2 | 3 | 4
  quickSetupPrompt?: string
  values: Partial<CreateGoalRequest>
  remarks?: string
}

function isQuickGoalSetupDraft(
  values: Partial<CreateGoalRequest>,
): values is QuickGoalSetupDraft {
  return Boolean(values.title && values.schedule && values.target)
}

function quickGoalSetupButtonLabel(
  isGenerating: boolean,
  hasQuestions: boolean,
): string {
  if (isGenerating) return 'Planning your goal…'
  if (hasQuestions) return 'Build goal'
  return 'Plan goal'
}

function QuickGoalSetupSheet({
  onGenerated,
  partnerName,
}: {
  onGenerated: (draft: QuickGoalSetupDraft, prompt: string) => void
  partnerName: string | null
}) {
  const bottomSheet = useBottomSheetController()
  const toast = useToast()
  const [prompt, setPrompt] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate(): Promise<void> {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.warning('Describe what you want to work on first')
      return
    }

    const planningAnswers: QuickGoalSetupAnswer[] | undefined = questions.length
      ? questions.map((question, index) => ({
          answer: answers[index]?.trim() ?? '',
          question,
        }))
      : undefined
    if (planningAnswers?.some(({ answer }) => !answer)) {
      toast.warning('Answer each question before creating the goal')
      return
    }

    setIsGenerating(true)
    try {
      const response = await goalAPI.quickSetup(trimmedPrompt, planningAnswers)
      if (response.data.kind === 'QUESTIONS') {
        setQuestions(response.data.questions.map(({ question }) => question))
        setAnswers(response.data.questions.map(() => ''))
        return
      }
      onGenerated(response.data.draft, trimmedPrompt)
      bottomSheet.dismiss()
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not set up that goal. Try again.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <View className="gap-4 pb-2">
      <Text className="text-sm text-card-lighter-2">
        {partnerName
          ? `${partnerName} will ask only if a detail matters, then build a goal you can edit.`
          : 'Share what you want to make progress on. You will only be asked when a detail matters.'}
      </Text>
      <TextArea
        autoFocus
        className="bg-card-light-100 placeholder:text-card-lighter-3"
        disabled={isGenerating || Boolean(questions.length)}
        maxLength={1_000}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="e.g. I want to read more, maybe 20 minutes after dinner"
        rows={4}
        value={prompt}
      />
      {questions.length ? (
        <View className="gap-3">
          <Text className="font-bold text-sm">A couple quick details</Text>
          {questions.map((question, index) => (
            <View className="gap-2" key={question}>
              <Text className="text-sm text-card-lighter-2">{question}</Text>
              <TextArea
                className="bg-card-light-100 placeholder:text-card-lighter-3"
                disabled={isGenerating}
                maxLength={1_000}
                onChange={(event) => {
                  const nextAnswers = [...answers]
                  nextAnswers[index] = event.target.value
                  setAnswers(nextAnswers)
                }}
                placeholder="Your answer"
                rows={2}
                value={answers[index] ?? ''}
              />
            </View>
          ))}
        </View>
      ) : null}
      <Button
        disabled={
          isGenerating ||
          !prompt.trim() ||
          (questions.length > 0 &&
            questions.some((_, index) => !answers[index]?.trim()))
        }
        fullWidth
        label={quickGoalSetupButtonLabel(
          isGenerating,
          Boolean(questions.length),
        )}
        leftIcon={
          isGenerating ? (
            <RiLoader4Line className="animate-spin" size={18} />
          ) : (
            <RiSparkling2Line size={18} />
          )
        }
        onClick={() => void handleGenerate()}
      />
    </View>
  )
}

function QuickGoalEditorSheet({
  draft,
  onEdited,
  partnerName,
  partnerAvatar,
  prompt,
}: {
  draft: QuickGoalSetupDraft
  onEdited: (draft: QuickGoalSetupDraft) => void
  partnerName: string | null
  partnerAvatar: string | null
  prompt: string
}) {
  const bottomSheet = useBottomSheetController()
  const toast = useToast()
  const [instruction, setInstruction] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  async function handleEdit(): Promise<void> {
    const trimmedInstruction = instruction.trim()
    if (!trimmedInstruction) {
      toast.warning('Tell your partner what to change first')
      return
    }

    setIsEditing(true)
    try {
      const edit: QuickGoalSetupEdit = {
        draft,
        instruction: trimmedInstruction,
      }
      const response = await goalAPI.quickSetup(prompt, undefined, edit)
      if (response.data.kind !== 'DRAFT') {
        throw new Error('Your partner needs a clearer change request')
      }
      onEdited(response.data.draft)
      bottomSheet.dismiss()
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not adjust that goal. Try again.',
      )
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <View className="gap-4 pb-2">
      <View className="flex-row gap-2">
        {partnerAvatar && (
          <img
            alt={`${partnerName} avatar`}
            className="size-7 rounded-full object-cover"
            src={partnerAvatar}
          />
        )}
        <Text className="text-sm text-card-lighter-2 bg-card-light/50 p-2 rounded-xl">
          {draft.remarks}
        </Text>
      </View>
      <View className="gap-2 rounded-2xl bg-card-light p-4 hidden">
        <Text className="text-xs font-bold text-card-lighter-2">
          Current goal
        </Text>
        <Text className="font-bold">{draft.title}</Text>
        {draft.description ? (
          <Text className="text-xs text-card-lighter-2">
            {draft.description}
          </Text>
        ) : null}
        <Text className="text-xs text-card-lighter-2">
          Reminders:{' '}
          {draft.reminderTimes?.length ? draft.reminderTimes.join(', ') : 'off'}
        </Text>
      </View>
      <TextArea
        autoFocus
        className="bg-card-light-100 placeholder:text-card-lighter-3"
        disabled={isEditing}
        maxLength={1_000}
        onChange={(event) => setInstruction(event.target.value)}
        placeholder="e.g. make it 30 minutes, start next Monday, remind me at 8pm"
        rows={3}
        value={instruction}
      />
      <Button
        disabled={isEditing || !instruction.trim()}
        fullWidth
        label={isEditing ? 'Adjusting goal…' : 'Adjust goal'}
        leftIcon={
          isEditing ? (
            <RiLoader4Line className="animate-spin" size={18} />
          ) : (
            <RiSparkling2Line size={18} />
          )
        }
        onClick={() => void handleEdit()}
      />
    </View>
  )
}

export default function CreateGoalScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const bottomSheet = useBottomSheetController()
  const [draft, setDraft] = useState<GoalDraftNavigation | undefined>(
    readGoalDraft,
  )
  const [formKey, setFormKey] = useState(0)
  const selectedPersona = user?.rewindPersona
    ? getRewindPersona(user.rewindPersona)
    : null

  function handleBack(): void {
    navigate({ to: '/app/goal' })
  }

  function openQuickSetup(): void {
    bottomSheet.present(
      <QuickGoalSetupSheet
        onGenerated={(values, prompt) => {
          setDraft({
            initialStep: 4,
            quickSetupPrompt: prompt,
            values,
            remarks: values.remarks,
          })
          setFormKey((current) => current + 1)
        }}
        partnerName={selectedPersona?.name ?? null}
      />,
      {
        size: 'semi-full',
        title: selectedPersona
          ? `${selectedPersona.name}'s quick setup`
          : 'Quick setup with AI',
      },
    )
  }

  function openPartnerAssistant(): void {
    if (!draft?.quickSetupPrompt || !isQuickGoalSetupDraft(draft.values)) {
      openQuickSetup()
      return
    }

    bottomSheet.present(
      <QuickGoalEditorSheet
        draft={draft.values}
        onEdited={(values) => {
          setDraft((current) =>
            current
              ? { ...current, initialStep: 4, values, remarks: values.remarks }
              : current,
          )
          setFormKey((current) => current + 1)
        }}
        partnerName={selectedPersona?.name ?? null}
        partnerAvatar={selectedPersona?.avatar ?? null}
        prompt={draft.quickSetupPrompt}
      />,
      {
        size: 'semi-full',
        title: selectedPersona
          ? `Adjusting with ${selectedPersona.name}`
          : 'Adjust goal with AI',
      },
    )
  }

  const canAdjustDraft = Boolean(
    draft?.quickSetupPrompt && isQuickGoalSetupDraft(draft.values),
  )

  return (
    <View className="flex-1 bg-cardd">
      <TopNotch />
      <NoiseComponent>
        <View className="flex-1 overflow-y-auto px-mg z-10">
          <View className="mb-5 mt-mg pb-mg flex-row items-center gap-3">
            <Pressable
              accessibilityLabel="Back to goals"
              className="size-10 items-center justify-center rounded-full bg-white"
              onPress={handleBack}
            >
              <RiArrowLeftLine className="text-black" size={20} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold">Set Goal</Text>
              {/* <Text className="text-sm text-card-lighter-2">
              A small, clear commitment.
            </Text> */}
            </View>
            <Pressable
              accessibilityLabel={
                canAdjustDraft
                  ? selectedPersona
                    ? `Adjust this goal with ${selectedPersona.name}`
                    : 'Adjust this goal with AI'
                  : selectedPersona
                    ? `Set up a goal with ${selectedPersona.name}`
                    : 'Set up a goal with AI'
              }
              className="relative size-11 items-center justify-center rounded-full bg-card-light-50"
              onPress={openPartnerAssistant}
            >
              {selectedPersona ? (
                <img
                  alt={`${selectedPersona.name} avatar`}
                  className="size-9 rounded-full object-cover"
                  src={selectedPersona.avatar}
                />
              ) : (
                <RiSparkling2Line className="text-white" size={20} />
              )}
              {selectedPersona ? (
                <View className="absolute -bottom-0.5 -right-0.5 size-4 items-center justify-center rounded-full bg-warning-yellow">
                  <RiSparkling2Line className="text-black" size={10} />
                </View>
              ) : null}

              {draft?.remarks && (
                <View className="absolute z-20 bottom-0 left-0 translate-y-[70%] -translate-x-[100%] drop-shadow-lg p-1 w-[200px]">
                  <View className="bg-card-light-100 relative text-[#c0c6e2] p-2 px-3 rounded-2xl text-xs max-w-[200px]">
                    <Text lines={2} className="font-semibold">
                      {draft?.remarks}
                    </Text>
                    <View className="size-5 rounded-full bg-card-light-100 top-0 absolute right-0 translate-y- translate-x-1/3"></View>
                    <View className="size-3 rounded-full bg-card-light-100 top-0 absolute right-0 -translate-y-[20%] translate-x-[170%]"></View>
                  </View>
                </View>
              )}
            </Pressable>
          </View>
          <CreateGoalSheet
            initialStep={draft?.initialStep}
            initialValues={draft?.values}
            key={formKey}
            onSuccess={() => navigate({ to: '/app/goal' })}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}

export function readGoalDraft(): GoalDraftNavigation | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = window.sessionStorage.getItem('rewind:goal-recommendation')
  if (!raw) return undefined
  window.sessionStorage.removeItem('rewind:goal-recommendation')
  try {
    const value: GoalDraftNavigation = JSON.parse(raw)
    if (!value || typeof value !== 'object') return undefined
    if ('values' in value && value.values && typeof value.values === 'object') {
      return {
        initialStep:
          value.initialStep === 2 ||
          value.initialStep === 3 ||
          value.initialStep === 4
            ? value.initialStep
            : 1,
        values: value.values as Partial<CreateGoalRequest>,
      }
    }
    return { values: value as Partial<CreateGoalRequest> }
  } catch(error) {
    alert(error)
    return undefined
  }
}
