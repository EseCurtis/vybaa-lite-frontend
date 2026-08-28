import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Achievement } from '@/shared/api/achievement.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import {
  RiInstagramLine,
  RiTwitterXLine,
  RiWhatsappLine,
} from '@remixicon/react'
import { motion } from 'framer-motion'
import type { CardType } from './flexx-card.component'

export interface ShareBottomSheetContentProps {
  cardRef: HTMLDivElement
  cardType: CardType
  onShare: (element: HTMLElement) => Promise<void>
  onDismiss: () => void
}

export interface AchievementSelectorProps {
  achievements: Achievement[]
  onSelect: (achievement: Achievement) => void
  selectedId?: string
}

export function AchievementSelector({
  achievements,
  onSelect,
  selectedId,
}: AchievementSelectorProps) {
  return (
    <View className="space-y-3">
      <Text className="text-white/70 text-sm font-bbh mb-2">
        Select Achievement to Flex
      </Text>
      <View className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {achievements.map((achievement) => {
          const isSelected = selectedId === achievement.id
          const emojiIcon = getEmojiIcon(achievement.badgeIcon)

          return (
            <motion.div
              key={achievement.id}
              whileTap={{ scale: 0.95 }}
              animate={
                isSelected
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <Pressable
                onPress={() => onSelect(achievement)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-warning-yellow/20 border-2 border-warning-yellow'
                    : 'bg-card-light border-2 border-transparent hover:bg-card-light/80'
                }`}
              >
                <Icon
                  icon={emojiIcon}
                  width={48}
                  height={48}
                  className="mb-2"
                />
                <Text className="text-white text-xs font-bbh text-center leading-tight line-clamp-2">
                  {achievement.title}
                </Text>
              </Pressable>
            </motion.div>
          )
        })}
      </View>
      {achievements.length === 0 && (
        <View className="py-12 items-center">
          <Text className="text-white/40 text-sm font-bbh text-center">
            No achievements yet. Keep going! 💪
          </Text>
        </View>
      )}
    </View>
  )
}

export function ShareBottomSheetContent({
  cardRef,
  cardType,
  onShare,
  onDismiss,
}: ShareBottomSheetContentProps) {
  const getCardTitle = () => {
    switch (cardType) {
      case 'daily':
        return 'Daily Discipline'
      case 'weekly':
        return 'Weekly Flexx'
      case 'streak':
        return 'Streak Power'
      case 'rewind':
        return 'Rewind Reflection'
    }
  }

  const handleShareAndClose = async () => {
    await onShare(cardRef)
    onDismiss()
  }

  return (
    <View className="space-y-4 pb-4">
      {/* Preview */}
      <View className="space-y-2 hidden">
        <Text className="text-white/70 text-sm font-bbh">Preview</Text>
        <View className="rounded-2xl overflow-hidden bg-card-light max-h-[300px] flex items-center justify-center p-4">
          <View
            className="w-full max-w-[180px] aspect-[9/16] rounded-xl overflow-hidden shadow-lg"
            style={{
              transform: 'scale(0.95)',
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: cardRef.outerHTML }}
              className="pointer-events-none"
            />
          </View>
        </View>
        <Text className="text-center text-white/50 text-xs font-bbh">
          {getCardTitle()} • Ready to share
        </Text>
      </View>

      {/* Share Options */}
      <View className="space-y-3">
        <Text className="text-white/70 text-sm font-bbh">Share to</Text>

        <View className="grid grid-cols-3 gap-3">
          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-pink-600/10 hover:bg-pink-600/20 transition-colors"
          >
            <RiInstagramLine size={32} className="text-pink-600 mb-2" />
            <Text className="text-pink-600 text-xs font-bbh font-semibold">
              Instagram
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-success-green/10 hover:bg-success-green/20 transition-colors"
          >
            <RiWhatsappLine size={32} className="text-success-green mb-2" />
            <Text className="text-success-green text-xs font-bbh font-semibold">
              WhatsApp
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <RiTwitterXLine size={32} className="text-blue-500 mb-2" />
            <Text className="text-blue-500 text-xs font-bbh font-semibold">
              Twitter
            </Text>
          </Pressable>
        </View>

        <Button
          label="Download"
          onClick={handleShareAndClose}
          variant="outline"
          className="w-full"
        />
      </View>
    </View>
  )
}
