import { Input } from '@/components/common/input.component'
import { Switch } from '@/components/common/switch.component'
import { TextArea } from '@/components/common/textarea.component'
import { TimeField } from '@/components/common/time-field.component'
import {
  MilestoneEditorSheet,
  type MilestoneDraft,
} from '@/components/custom/community/milestone-editor-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateTemplate } from '@/hooks/use-communities.hook'
import { RiAddLine, RiDeleteBinLine } from '@remixicon/react'
import { useEffect, useState } from 'react'

interface CreateTemplateSheetProps {
  communityId: string
  onSuccess?: () => void
}

export function CreateTemplateSheet({
  communityId,
  onSuccess,
}: CreateTemplateSheetProps) {
  const { mutateAsync: createTemplate, isPending: isCreating } =
    useCreateTemplate()

  const [formData, setFormData] = useState({
    goalText: '',
    targetDays: '',
    reminderTime: '',
  })
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [milestonesEnabled, setMilestonesEnabled] = useState(false)
  const [isMilestoneWizardOpen, setIsMilestoneWizardOpen] = useState(false)
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<
    number | null
  >(null)

  // Restore last draft state per community
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(
        `community_template_draft_${communityId}`,
      )
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft && typeof draft === 'object') {
        if (draft.formData) {
          setFormData((prev) => ({
            ...prev,
            ...draft.formData,
          }))
        }
        if (Array.isArray(draft.milestones)) {
          setMilestones(draft.milestones)
        }
        if (typeof draft.reminderEnabled === 'boolean') {
          setReminderEnabled(draft.reminderEnabled)
        }
        if (typeof draft.milestonesEnabled === 'boolean') {
          setMilestonesEnabled(draft.milestonesEnabled)
        }
      }
    } catch {
      // Ignore bad drafts
    }
  }, [communityId])

  // Persist draft whenever key pieces change
  useEffect(() => {
    if (typeof window === 'undefined') return
    const draft = {
      formData,
      milestones,
      reminderEnabled,
      milestonesEnabled,
    }
    try {
      window.localStorage.setItem(
        `community_template_draft_${communityId}`,
        JSON.stringify(draft),
      )
    } catch {
      // ignore storage errors
    }
  }, [communityId, formData, milestones, reminderEnabled, milestonesEnabled])

  const handleSubmit = async () => {
    if (!formData.goalText.trim()) {
      setFormError('Goal text is required')
      return
    }

    const targetDays = parseInt(formData.targetDays, 10)
    if (!targetDays || targetDays < 1 || targetDays > 365) {
      setFormError('Target days must be between 1 and 365')
      return
    }

    // Enforce milestones within duration constraints only when enabled
    if (milestonesEnabled && milestones.length > 0) {
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i]
        const value = Number(m.triggerValue)
        const label = m.name?.trim() || `Milestone ${i + 1}`

        if (!value || value < 1) {
          setFormError(`Trigger value for ${label} must be at least 1`)
          return
        }

        if (m.triggerType === 'DAY') {
          if (value > targetDays) {
            setFormError(
              `${label}: value cannot be greater than total days (${targetDays})`,
            )
            return
          }
        }

        if (m.triggerType === 'SEQUENCE') {
          const startDay = Number(m.sequenceStartDay)
          const endDay = Number(m.sequenceEndDay)
          if (!startDay || startDay < 1) {
            setFormError(`${label}: start day must be at least 1`)
            return
          }
          if (!endDay || endDay < startDay || endDay > targetDays) {
            setFormError(
              `${label}: end day must be between the start day and day ${targetDays}`,
            )
            return
          }
        }

        if (m.triggerType === 'PERCENTAGE') {
          if (value < 1 || value > 100) {
            setFormError(`${label}: percentage must be between 1 and 100`)
            return
          }
        }
      }
    }

    try {
      setFormError(null)
      await createTemplate({
        communityId,
        data: {
          goalText: formData.goalText.trim(),
          targetDays,
          reminderTime: formData.reminderTime || undefined,
          milestones:
            milestonesEnabled && milestones.length > 0
              ? milestones.map((m, index) => ({
                  name: m.name.trim(),
                  description: m.description?.trim() || undefined,
                  triggerType: m.triggerType,
                  triggerValue: Number(m.triggerValue),
                  points: Number(m.points) || 0,
                  sequenceBonusPoints:
                    m.triggerType === 'SEQUENCE'
                      ? Number(m.sequenceBonusPoints || '10')
                      : undefined,
                  sequenceStartDay:
                    m.triggerType === 'SEQUENCE'
                      ? Number(m.sequenceStartDay)
                      : undefined,
                  sequenceEndDay:
                    m.triggerType === 'SEQUENCE'
                      ? Number(m.sequenceEndDay)
                      : undefined,
                  order: index,
                }))
              : undefined,
        },
      })

      setFormData({ goalText: '', targetDays: '', reminderTime: '' })
      setMilestones([])
      setReminderEnabled(false)
      setMilestonesEnabled(false)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(
          `community_template_draft_${communityId}`,
        )
      }
      onSuccess?.()
    } catch (err: any) {
      setFormError(err.message || 'Failed to create template')
    }
  }

  const openCreateMilestone = () => {
    if (!milestonesEnabled) {
      setFormError('Enable milestones before adding them')
      return
    }
    const targetDaysNum = parseInt(formData.targetDays, 10)
    if (!targetDaysNum || targetDaysNum < 1) {
      setFormError('Set duration (days) before adding milestones')
      return
    }
    setEditingMilestoneIndex(null)
    setIsMilestoneWizardOpen(true)
  }

  const openEditMilestone = (index: number) => {
    if (!milestonesEnabled) {
      setFormError('Enable milestones before editing them')
      return
    }
    const targetDaysNum = parseInt(formData.targetDays, 10)
    if (!targetDaysNum || targetDaysNum < 1) {
      setFormError('Set duration (days) before editing milestones')
      return
    }
    setEditingMilestoneIndex(index)
    setIsMilestoneWizardOpen(true)
  }

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index))
  }

  const targetDaysNum = Number(formData.targetDays) || undefined

  if (isMilestoneWizardOpen) {
    const initial =
      editingMilestoneIndex !== null
        ? milestones[editingMilestoneIndex]
        : undefined

    return (
      <View className="space-y-4">
        <MilestoneEditorSheet
          initial={initial}
          maxDays={targetDaysNum}
          onSave={(milestone) => {
            setMilestones((prev) => {
              if (editingMilestoneIndex === null) {
                return [...prev, milestone]
              }
              return prev.map((m, i) =>
                i === editingMilestoneIndex ? milestone : m,
              )
            })
            setIsMilestoneWizardOpen(false)
          }}
          onCancel={() => setIsMilestoneWizardOpen(false)}
        />
      </View>
    )
  }

  return (
    <View className="space-y-4">
      <View>
        <TextArea
          placeholder="What's the commitment?"
          value={formData.goalText}
          onChange={(e) => {
            setFormData({ ...formData, goalText: e.target.value })
            setFormError(null)
          }}
          className="min-h-[100px] rounded-xl bg-card-light/30 p-2 px-3 text-white"
          maxLength={500}
        />
      </View>
      <View>
        <Input
          type="number"
          placeholder="Days (1-365)"
          value={formData.targetDays}
          onChange={(e) => {
            setFormData({ ...formData, targetDays: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light/30 border-0 text-white"
          min={1}
          max={365}
        />
      </View>

      <View className="rounded-2xl p-3 space-y-2 bg-card-light/10">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-white/80 text-sm font-bbh">Milestones</Text>
            <Text className="text-card-lighter-3/70 text-[11px] font-bbh">
              (optional)
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-card-lighter-3/80 text-[11px] font-bbh">
              Enable
            </Text>
            <Switch
              checked={milestonesEnabled}
              onChange={(checked) => {
                setMilestonesEnabled(checked)
                if (!checked) {
                  setMilestones([])
                }
              }}
            />
          </View>
        </View>

        {milestonesEnabled && (
          <View className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {milestones.length === 0 && (
              <Text className="text-card-lighter-3/70 text-xs font-bbh">
                Add milestones to reward progress on this template.
              </Text>
            )}

            {milestones.map((m, index) => (
              <Pressable
                key={index}
                onPress={() => openEditMilestone(index)}
                className="rounded-xl flex-col text-left bg-card-light/20 px-3 py-3 space-y-1 relative active:scale-[0.98] transition-transform"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 pr-7">
                    <Text className="text-white/80 text-xs font-bbh">
                      {m.name || `Milestone ${index + 1}`}
                    </Text>
                    {m.description && (
                      <Text className="text-white/50 text-[11px] font-bbh">
                        {m.description}
                      </Text>
                    )}
                    <Text className="text-card-lighter-3/80 text-[11px] font-bbh mt-0.5">
                      {m.triggerType === 'DAY'
                        ? `Day ${m.triggerValue || '?'}`
                        : m.triggerType === 'PERCENTAGE'
                          ? `${m.triggerValue || '?'}% of goal`
                          : `${m.points || '0'} pts every ${m.triggerValue || '?'} days`}{' '}
                      {m.triggerType !== 'SEQUENCE'
                        ? `• +${m.points || '0'} pts`
                        : ''}
                      {m.triggerType === 'SEQUENCE'
                        ? `• +${m.sequenceBonusPoints || '10'} each time • days ${m.sequenceStartDay || '?'}–${m.sequenceEndDay || '?'}`
                        : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    if (confirm('Remove this milestone?')) {
                      setMilestones((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  }}
                  className="absolute right-1 bottom-1 p-1 rounded-full bg-card-light/40 hover:bg-card-light/60 transition-colors"
                >
                  <RiDeleteBinLine size={14} className="text-danger-400" />
                </Pressable>
              </Pressable>
            ))}

            <Button
              label="Add milestone"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={openCreateMilestone}
              textClassName="text-xs"
              rightIcon={<RiAddLine color="#fff" />}
              className=" !bg-card-lighter/20"
            />
          </View>
        )}

        {!milestonesEnabled && (
          <Text className="text-card-lighter-3/70 text-xs font-bbh">
            Toggle milestones on to define progress rewards for this template.
          </Text>
        )}
      </View>

      <View className="p-3 space-y-2 rounded-2xl bg-card-light/10">
        <View className="flex-row items-center justify-between">
          <Text className="text-card-lighter-3/80 text-xs font-bbh">
            Reminder time (optional)
          </Text>
          <Switch
            checked={reminderEnabled}
            onChange={(checked) => {
              setReminderEnabled(checked)
              if (!checked) {
                setFormData({ ...formData, reminderTime: '' })
              }
            }}
          />
        </View>

        {reminderEnabled && (
          <TimeField
            value={formData.reminderTime}
            onChange={(val) => {
              setFormData({ ...formData, reminderTime: val })
              setFormError(null)
            }}
            disabled={!reminderEnabled}
          />
        )}
        <Text className="text-card-lighter-3/60 text-xs text-left font-bbh mt-1 ml-1">
          Set a daily reminder time (optional) - toggle on to schedule
        </Text>
      </View>

      {formError && (
        <Text className="text-danger-500 text-sm font-bbh">{formError}</Text>
      )}

      <Button
        label="Create Template"
        variant="default"
        fullWidth
        onClick={handleSubmit}
        disabled={isCreating}
        loading={isCreating}
        textClassName="text-sm"
      />
    </View>
  )
}
