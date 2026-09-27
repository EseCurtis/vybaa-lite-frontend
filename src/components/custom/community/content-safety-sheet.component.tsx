import {
  RiAlarmWarningLine,
  RiArrowLeftLine,
  RiForbid2Line,
  RiShieldCheckLine,
} from '@remixicon/react'
import { useState } from 'react'

import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBlockUser, useReportContent } from '@/hooks/use-communities.hook'
import type {
  CreateModerationReportRequest,
  ModerationReportTarget,
} from '@/shared/api/community.api'

type SafetyStep = 'actions' | 'block' | 'report'
type ReportReason = CreateModerationReportRequest['reason']

interface ContentSafetySheetProps {
  communityId?: string
  onBlocked?: () => void
  onReported?: () => void
  targetId: string
  targetType: ModerationReportTarget
  targetUserId: string
  username: string
}

const reportReasons: Array<{ label: string; value: ReportReason }> = [
  { label: 'Harassment or bullying', value: 'harassment' },
  { label: 'Hate speech', value: 'hate' },
  { label: 'Sexual content', value: 'sexual' },
  { label: 'Violence or threats', value: 'violence' },
  { label: 'Spam or scam', value: 'spam' },
  { label: 'Something else', value: 'other' },
]

export function ContentSafetySheet({
  communityId,
  onBlocked,
  onReported,
  targetId,
  targetType,
  targetUserId,
  username,
}: ContentSafetySheetProps) {
  const blockUser = useBlockUser(communityId)
  const reportContent = useReportContent()
  const [details, setDetails] = useState('')
  const [reason, setReason] = useState<ReportReason>('harassment')
  const [step, setStep] = useState<SafetyStep>('actions')

  const evidence: CreateModerationReportRequest = {
    details: details.trim() || undefined,
    reason,
    targetId,
    targetType,
  }

  function submitReport(): void {
    reportContent.mutate(evidence, { onSuccess: onReported })
  }

  function confirmBlock(): void {
    blockUser.mutate(
      { evidence, userId: targetUserId },
      { onSuccess: onBlocked },
    )
  }

  if (step === 'actions') {
    return (
      <View className="gap-3 pb-2">
        <Text className="text-sm leading-5 text-card-lighter-3 font-bbh">
          Reports are private. Vybaa reviews safety reports within 24 hours.
        </Text>
        <Pressable
          accessibilityLabel={`Report ${username}`}
          onPress={() => setStep('report')}
          className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-card-light-100 px-4 py-3"
        >
          <View className="size-10 items-center justify-center rounded-xl bg-warning-900">
            <RiAlarmWarningLine className="text-warning-300" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-white font-bbh">
              Report content
            </Text>
            <Text className="mt-1 text-xs text-card-lighter-3 font-bbh">
              Send this to Vybaa’s safety team
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel={`Block ${username}`}
          onPress={() => setStep('block')}
          className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-card-light-100 px-4 py-3"
        >
          <View className="size-10 items-center justify-center rounded-xl bg-danger-900">
            <RiForbid2Line className="text-danger-300" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-white font-bbh">
              Block @{username}
            </Text>
            <Text className="mt-1 text-xs text-card-lighter-3 font-bbh">
              Hide their content now and alert our safety team
            </Text>
          </View>
        </Pressable>
      </View>
    )
  }

  if (step === 'block') {
    return (
      <View className="gap-4 pb-2">
        <Pressable
          accessibilityLabel="Back to safety actions"
          onPress={() => setStep('actions')}
          className="size-11 items-center justify-center"
        >
          <RiArrowLeftLine className="text-white" size={20} />
        </Pressable>
        <View className="items-center gap-2 px-2 text-center">
          <View className="size-12 items-center justify-center rounded-2xl bg-danger-900">
            <RiForbid2Line className="text-danger-300" size={24} />
          </View>
          <Text className="text-lg font-bold text-white font-bbh">
            Block @{username}?
          </Text>
          <Text className="text-sm leading-5 text-card-lighter-3 font-bbh">
            Their content disappears from your feed immediately. They can’t view
            your profile, and Vybaa receives a safety report.
          </Text>
        </View>
        <Button
          disabled={blockUser.isPending}
          fullWidth
          label="Block user"
          loading={blockUser.isPending}
          onClick={confirmBlock}
          variant="destructive"
        />
      </View>
    )
  }

  return (
    <View className="gap-4 pb-2">
      <Pressable
        accessibilityLabel="Back to safety actions"
        onPress={() => setStep('actions')}
        className="size-11 items-center justify-center"
      >
        <RiArrowLeftLine className="text-white" size={20} />
      </Pressable>
      <View className="flex-row items-center gap-2">
        <RiShieldCheckLine className="text-warning-yellow" size={20} />
        <Text className="text-lg font-bold text-white font-bbh">
          Why are you reporting this?
        </Text>
      </View>
      <View className="grid grid-cols-2 gap-2">
        {reportReasons.map((item) => {
          const selected = reason === item.value
          return (
            <Pressable
              key={item.value}
              aria-pressed={selected}
              onPress={() => setReason(item.value)}
              className={`min-h-11 items-center justify-center rounded-full px-3 ${selected ? 'bg-white' : 'bg-card-light-100'}`}
            >
              <Text
                className={`text-center text-xs font-bold font-bbh ${selected ? 'text-black' : 'text-card-lighter-3'}`}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <TextArea
        className="min-h-24 rounded-2xl bg-card-light-100 p-4 text-white"
        maxLength={1000}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Add details for the safety team (optional)"
        value={details}
      />
      <Button
        disabled={reportContent.isPending}
        fullWidth
        label="Send report"
        loading={reportContent.isPending}
        onClick={submitReport}
      />
    </View>
  )
}
