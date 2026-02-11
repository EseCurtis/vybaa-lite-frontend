import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import beamingFaceWithSmilingEyes from '@iconify-icons/twemoji/beaming-face-with-smiling-eyes'
import cryingFace from '@iconify-icons/twemoji/crying-face'
import anxiousFaceWithSweat from '@iconify-icons/twemoji/anxious-face-with-sweat'
import relievedFace from '@iconify-icons/twemoji/relieved-face'
import partyingFace from '@iconify-icons/twemoji/partying-face'
import sleepingFace from '@iconify-icons/twemoji/sleeping-face'
import faceWithSteamFromNose from '@iconify-icons/twemoji/face-with-steam-from-nose'
import neutralFace from '@iconify-icons/twemoji/neutral-face'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

const MOODS = [
  { value: 'happy', label: 'Happy', icon: beamingFaceWithSmilingEyes, color: 'from-yellow-500/30 to-amber-500/30' },
  { value: 'sad', label: 'Sad', icon: cryingFace, color: 'from-blue-500/30 to-indigo-500/30' },
  { value: 'anxious', label: 'Anxious', icon: anxiousFaceWithSweat, color: 'from-orange-500/30 to-red-500/30' },
  { value: 'calm', label: 'Calm', icon: relievedFace, color: 'from-teal-500/30 to-cyan-500/30' },
  { value: 'excited', label: 'Excited', icon: partyingFace, color: 'from-pink-500/30 to-rose-500/30' },
  { value: 'tired', label: 'Tired', icon: sleepingFace, color: 'from-purple-500/30 to-violet-500/30' },
  { value: 'frustrated', label: 'Frustrated', icon: faceWithSteamFromNose, color: 'from-red-500/30 to-orange-500/30' },
  { value: 'neutral', label: 'Neutral', icon: neutralFace, color: 'from-gray-500/30 to-slate-500/30' },
]

interface MoodSelectorProps {
  selected?: string | null
  onSelect: (mood: string) => void
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View className="w-full">
      <Text className="text-white/70 text-sm font-bbh mb-3">How are you feeling?</Text>
      
      <View className="flex flex-row gap-2 overflow-x-auto pb-2 no-scrollbar">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value

          return (
            <motion.button
              key={mood.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(mood.value)}
              className={`shrink-0 rounded-2xl px-4 py-3 transition-all border-2 ${
                isSelected
                  ? 'border-white/40 bg-gradient-to-br ' + mood.color
                  : 'border-white/10 bg-card-700/40'
              }`}
              >
                <View className="flex flex-col items-center gap-1">
                  <Icon icon={mood.icon} className="text-white" style={{ fontSize: '32px' }} />
                  <Text
                    className={`text-xs font-bbh font-semibold ${
                      isSelected ? 'text-white' : 'text-white/60'
                    }`}
                  >
                    {mood.label}
                  </Text>
                </View>
              </motion.button>
          )
        })}
      </View>
    </View>
  )
}
