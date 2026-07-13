import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { MilestoneTriggerType } from '@/shared/api/community.api'
import { cn } from '@/shared/utils/helpers.util'
import { useState } from 'react'

export interface MilestoneDraft {
  id?: string
  name: string
  description?: string
  triggerType: MilestoneTriggerType
  triggerValue: string
  points: string
  sequenceBonusPoints?: string
}

interface MilestoneEditorSheetProps {
  initial?: MilestoneDraft
  onSave: (milestone: MilestoneDraft) => void
  onCancel?: () => void
  maxDays?: number
}

function getTriggerLabel(triggerType: MilestoneTriggerType): string {
  if (triggerType === 'DAY') {
    return 'Day'
  }

  if (triggerType === 'PERCENTAGE') {
    return '%'
  }

  return 'Every'
}

function getTriggerPlaceholder(triggerType: MilestoneTriggerType): string {
  if (triggerType === 'PERCENTAGE') {
    return '50'
  }

  if (triggerType === 'SEQUENCE') {
    return '5'
  }

  return '7'
}

function getSequencePreview(draft: MilestoneDraft): string | null {
  if (draft.triggerType !== 'SEQUENCE') {
    return null
  }

  const interval = Number(draft.triggerValue)
  const start = Number(draft.points)
  const step = Number(draft.sequenceBonusPoints || '10')

  if (!interval || interval < 1 || start < 0 || step < 0) {
    return null
  }

  return `${interval}, ${interval * 2}, ${interval * 3} checks: +${start} -> +${start + step} -> +${start + step * 2}`
}

export function MilestoneEditorSheet({
  initial,
  onSave,
  onCancel,
  maxDays,
}: MilestoneEditorSheetProps) {
  const [draft, setDraft] = useState<MilestoneDraft>(
    initial ?? {
      name: '',
      description: '',
      triggerType: 'DAY',
      triggerValue: '',
      points: '',
      sequenceBonusPoints: '10',
    },
  )

  const [error, setError] = useState<string | null>(null)
  const isSequence = draft.triggerType === 'SEQUENCE'
  const sequencePreview = getSequencePreview(draft)

  const handleSave = () => {
    if (!draft.name.trim()) {
      setError('Milestone name is required')
      return
    }
    const value = Number(draft.triggerValue)
    if (!value || value < 1) {
      setError('Trigger value must be at least 1')
      return
    }

    if (draft.triggerType === 'DAY' || draft.triggerType === 'SEQUENCE') {
      if (typeof maxDays === 'number' && value > maxDays) {
        setError(`Value cannot be greater than ${maxDays}`)
        return
      }
    }

    if (draft.triggerType === 'PERCENTAGE') {
      if (value < 1 || value > 100) {
        setError('Percentage must be between 1 and 100')
        return
      }
    }
    const pts = Number(draft.points || '0')
    if (pts < 0) {
      setError('Points cannot be negative')
      return
    }

    const bonusPoints = Number(draft.sequenceBonusPoints || '10')
    if (draft.triggerType === 'SEQUENCE' && bonusPoints < 0) {
      setError('Sequence bonus cannot be negative')
      return
    }

    setError(null)
    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description?.trim() || '',
      triggerValue: String(value),
      points: String(pts),
      sequenceBonusPoints:
        draft.triggerType === 'SEQUENCE' ? String(bonusPoints) : undefined,
    })

    // If creating (no initial), reset form so user can add another without closing
    if (!initial) {
      setDraft({
        name: '',
        description: '',
        triggerType: 'DAY',
        triggerValue: '',
        points: '',
        sequenceBonusPoints: '10',
      })
    }
  }

  return (
    <View className="space-y-3">
      <View className="space-y-2">
        <View>
          <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
            Reward timing
          </Text>
          <View className="flex-row">
            <View className="flex-row p-1 gap-2 bg-card-lighter-2/5 rounded-full">
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, sequenceBonusPoints: undefined, triggerType: 'DAY' })
                }
                className={`px-3 py-1.5 rounded-full text-md font-bbh ${
                  draft.triggerType === 'DAY'
                    ? 'bg-accent-500/80 border-accent-500 text-white'
                    : 'bg-card-light/20 border-card-lighter-3/40 text-card-lighter-3/80'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sequenceBonusPoints: undefined,
                    triggerType: 'PERCENTAGE',
                  })
                }
                className={`px-3 py-1.5 rounded-full text-md font-bbh ${
                  draft.triggerType === 'PERCENTAGE'
                    ? 'bg-accent-500/80 border-accent-500 text-white '
                    : 'bg-card-light/20 border-card-lighter-3/40 text-card-lighter-3/80'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sequenceBonusPoints: draft.sequenceBonusPoints || '10',
                    triggerType: 'SEQUENCE',
                  })
                }
                className={`px-3 py-1.5 rounded-full text-md font-bbh ${
                  draft.triggerType === 'SEQUENCE'
                    ? 'bg-accent-500/80 border-accent-500 text-white '
                    : 'bg-card-light/20 border-card-lighter-3/40 text-card-lighter-3/80'
                }`}
              >
                Every
              </button>
            </View>
          </View>
        </View>

        <View
          className={cn(
            'grid gap-2',
            isSequence ? 'grid-cols-3' : 'grid-cols-2',
          )}
        >
          <View>
            <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
              {getTriggerLabel(draft.triggerType)}
            </Text>
            <Input
              type="number"
              value={draft.triggerValue}
              onChange={(e) =>
                setDraft({ ...draft, triggerValue: e.target.value })
              }
              className="bg-card-light/30 border-0 text-white text-xs"
              min={1}
              placeholder={getTriggerPlaceholder(draft.triggerType)}
            />
          </View>

          <View>
            <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
              {isSequence ? 'Start' : 'Points'}
            </Text>
            <Input
              type="number"
              value={draft.points}
              onChange={(e) => setDraft({ ...draft, points: e.target.value })}
              className="bg-card-light/30 border-0 text-white text-xs"
              min={0}
              placeholder="20"
            />
          </View>

          {isSequence && (
            <View>
              <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
                Step
              </Text>
              <Input
                type="number"
                value={draft.sequenceBonusPoints || ''}
                onChange={(e) =>
                  setDraft({ ...draft, sequenceBonusPoints: e.target.value })
                }
                className="bg-card-light/30 border-0 text-white text-xs"
                min={0}
                placeholder="10"
              />
            </View>
          )}
        </View>

        {sequencePreview && (
          <View className="rounded-xl bg-accent-500/10 px-3 py-2">
            <Text className="text-accent-300 text-[11px] font-bbh">
              {sequencePreview}
            </Text>
          </View>
        )}
      </View>
      <Input
        placeholder="Milestone name (e.g. First week)"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="bg-card-light/30 border-0 text-white text-xs"
      />

      <TextArea
        placeholder="Description (optional)"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        className="min-h-[80px] rounded-xl bg-card-light/20 p-1 text-white text-md p-2 px-3"
        maxLength={200}
      />

      {error && (
        <Text className="text-danger-500 text-xs font-bbh">{error}</Text>
      )}

      <View className="flex-row justify-end gap-2 pt-5">
        {onCancel && (
          <Button
            label="Cancel"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            textClassName="text-xs !text-white"
          />
        )}
        <Button
          label={initial ? 'Save changes' : 'Add milestone'}
          variant="default"
          size="sm"
          onClick={handleSave}
          textClassName="text-xs"
        />
      </View>
    </View>
  )
}
