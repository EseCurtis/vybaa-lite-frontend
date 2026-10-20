import anxiousFaceWithSweat from '@iconify-icons/twemoji/anxious-face-with-sweat'
import beamingFaceWithSmilingEyes from '@iconify-icons/twemoji/beaming-face-with-smiling-eyes'
import cryingFace from '@iconify-icons/twemoji/crying-face'
import faceWithSteamFromNose from '@iconify-icons/twemoji/face-with-steam-from-nose'
import neutralFace from '@iconify-icons/twemoji/neutral-face'
import partyingFace from '@iconify-icons/twemoji/partying-face'
import relievedFace from '@iconify-icons/twemoji/relieved-face'
import sleepingFace from '@iconify-icons/twemoji/sleeping-face'
import { Icon } from '@iconify/react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

const MOODS = [
  {
    value: 'happy',
    label: 'Happy',
    icon: beamingFaceWithSmilingEyes,
  },
  {
    value: 'sad',
    label: 'Sad',
    icon: cryingFace,
  },
  {
    value: 'anxious',
    label: 'Anxious',
    icon: anxiousFaceWithSweat,
  },
  {
    value: 'calm',
    label: 'Calm',
    icon: relievedFace,
  },
  {
    value: 'excited',
    label: 'Excited',
    icon: partyingFace,
  },
  {
    value: 'tired',
    label: 'Tired',
    icon: sleepingFace,
  },
  {
    value: 'frustrated',
    label: 'Frustrated',
    icon: faceWithSteamFromNose,
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: neutralFace,
  },
]

interface MoodSelectorProps {
  selected?: string | null
  onSelect: (mood: string) => void
  disabled?: boolean
}

export function MoodSelector({
  selected,
  onSelect,
  disabled = false,
}: MoodSelectorProps): ReactElement {
  return (
    <View className="w-full gap-3" role="group" aria-label="Journal mood">
      <Text className="text-card-lighter-3 text-sm font-bbh">
        How are you feeling?
      </Text>

      <View className="grid grid-cols-4 gap-2">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value

          return (
            <Pressable
              key={mood.value}
              type="button"
              onPress={() => onSelect(mood.value)}
              aria-pressed={isSelected}
              disabled={disabled}
              accessibilityLabel={mood.label}
              className={`min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
                isSelected
                  ? 'bg-white text-black'
                  : 'bg-card-light-100 text-card-lighter-3 active:bg-card-light'
              }`}
            >
              <Icon
                icon={mood.icon}
                aria-hidden="true"
                width={20}
                height={20}
                className="shrink-0"
              />
              <Text
                className={`text-xs font-bbh font-semibold ${
                  isSelected ? 'text-black' : 'text-card-lighter-3'
                }`}
              >
                {mood.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
