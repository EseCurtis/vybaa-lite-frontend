import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { MilestoneTriggerType } from '@/shared/api/community.api'
import { useState } from 'react'

export interface MilestoneDraft {
  id?: string
  name: string
  description?: string
  triggerType: MilestoneTriggerType
  triggerValue: string
  points: string
}

interface MilestoneEditorSheetProps {
  initial?: MilestoneDraft
  onSave: (milestone: MilestoneDraft) => void
  onCancel?: () => void
  maxDays?: number
}

export function MilestoneEditorSheet({
  initial,
  onSave,
  onCancel,
}: MilestoneEditorSheetProps) {
  const [draft, setDraft] = useState<MilestoneDraft>(
    initial ?? {
      name: '',
      description: '',
      triggerType: 'DAY',
      triggerValue: '',
      points: '',
    },
  )

  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    if (!draft.name.trim()) {
      setError('Milestone name is required')
      return
    }
    const value = parseInt(draft.triggerValue, 10)
    if (!value || value < 1) {
      setError('Trigger value must be at least 1')
      return
    }

    if (draft.triggerType === 'DAY') {
      // Duration should already be set before opening, but guard just in case.
      if (typeof maxDays === 'number' && value > maxDays) {
        setError(`Day cannot be greater than ${maxDays}`)
        return
      }
    }

    if (draft.triggerType === 'PERCENTAGE') {
      if (value < 1 || value > 100) {
        setError('Percentage must be between 1 and 100')
        return
      }
    }
    const pts = parseInt(draft.points || '0', 10)
    if (pts < 0) {
      setError('Points cannot be negative')
      return
    }

    setError(null)
    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description?.trim() || '',
      triggerValue: String(value),
      points: String(pts),
    })

    // If creating (no initial), reset form so user can add another without closing
    if (!initial) {
      setDraft({
        name: '',
        description: '',
        triggerType: 'DAY',
        triggerValue: '',
        points: '',
      })
    }
  }

  return (
    <View className="space-y-3">
      <View className="flex-row-reverse gap-3 items-center justify-between">
        <View className="flex-1">
          <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
            Trigger type
          </Text>
          <View className="flex-row">
            <View className="flex-row p-1 gap-2 bg-card-lighter-2/5 rounded-full">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, triggerType: 'DAY' })}
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
                  setDraft({ ...draft, triggerType: 'PERCENTAGE' })
                }
                className={`px-3 py-1.5 rounded-full text-md font-bbh ${
                  draft.triggerType === 'PERCENTAGE'
                    ? 'bg-accent-500/80 border-accent-500 text-white '
                    : 'bg-card-light/20 border-card-lighter-3/40 text-card-lighter-3/80'
                }`}
              >
                %
              </button>
            </View>
          </View>
        </View>

        <View className="w-24">
          <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
            {draft.triggerType}
          </Text>
          <Input
            type="number"
            value={draft.triggerValue}
            onChange={(e) =>
              setDraft({ ...draft, triggerValue: e.target.value })
            }
            className="bg-card-light/30 border-0 text-white text-xs"
            min={1}
            placeholder="10"
          />
        </View>

        <View className="w-24">
          <Text className="text-card-lighter-3/70 text-[11px] font-bbh mb-1">
            Points
          </Text>
          <Input
            type="number"
            value={draft.points}
            onChange={(e) => setDraft({ ...draft, points: e.target.value })}
            className="bg-card-light/30 border-0 text-white text-xs"
            min={0}
            placeholder="5.5"
          />
        </View>
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
