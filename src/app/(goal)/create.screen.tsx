import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { CreateGoalSheet } from '@/components/custom/goal/create-goal-sheet.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CreateGoalRequest } from '@/shared/api/goal.api'
import { useNavigate } from '@tanstack/react-router'
import { RiArrowLeftLine } from '@remixicon/react'
import { useState } from 'react'

export default function CreateGoalScreen() {
  const navigate = useNavigate()
  const [initialValues] = useState<Partial<CreateGoalRequest> | undefined>(
    readGoalDraft,
  )

  return (
    <View className="flex-1 bg-cardd">
      <TopNotch />
      <NoiseComponent>
        <View className="flex-1 overflow-y-auto px-mg">
          <View className="mb-5 mt-2 flex-row items-center gap-3">
            <Pressable
              accessibilityLabel="Back to goals"
              className="size-10 items-center justify-center rounded-full bg-card-light-50"
              onPress={() => navigate({ to: '/app/goal' })}
            >
              <RiArrowLeftLine className="text-card-lighter-3" size={20} />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold">Create a goal</Text>
              <Text className="text-sm text-card-lighter-2">
                Give your next step a shape you can keep.
              </Text>
            </View>
          </View>
          <CreateGoalSheet
            initialValues={initialValues}
            onSuccess={() => navigate({ to: '/app/goal' })}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}

function readGoalDraft(): Partial<CreateGoalRequest> | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = window.sessionStorage.getItem('rewind:goal-recommendation')
  if (!raw) return undefined
  window.sessionStorage.removeItem('rewind:goal-recommendation')
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return undefined
    return value as Partial<CreateGoalRequest>
  } catch {
    return undefined
  }
}
