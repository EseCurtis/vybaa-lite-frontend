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
import type { CardType } from './flexx-card.component'

export interface ShareBottomSheetContentProps {
  cardRef: HTMLDivElement
  cardType: CardType
  onShare: (element: HTMLElement) => Promise<boolean>
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
      <Text className="text-card-lighter-3 text-sm font-bbh mb-2">
        Select Achievement to Flex
      </Text>
      <View className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {achievements.map((achievement) => {
          const isSelected = selectedId === achievement.id
          const emojiIcon = getEmojiIcon(achievement.badgeIcon)

          return (
            <Pressable
              key={achievement.id}
              onPress={() => onSelect(achievement)}
              aria-pressed={isSelected}
              className={`min-h-28 w-full min-w-0 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl !transition-colors ${
                isSelected
                  ? 'bg-white text-black'
                  : 'bg-card-light-100 text-white hover:bg-card-light'
              }`}
            >
              <Icon icon={emojiIcon} width={48} height={48} className="mb-2" />
              <Text className="w-full break-words text-xs font-bbh text-center leading-tight line-clamp-2">
                {achievement.title}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {achievements.length === 0 && (
        <View className="py-12 items-center">
          <Text className="text-card-lighter-3 text-sm font-bbh text-center">
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
      case 'achievement':
        return 'Achievement'
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
        <Text className="text-card-lighter-3 text-sm font-bbh">
          Share your progress
        </Text>

        <View className="grid grid-cols-3 gap-3">
          <Pressable
            onPress={handleShareAndClose}
            className="min-h-24 flex flex-col items-center justify-center p-4 rounded-2xl bg-card-light-100 hover:bg-card-light !transition-colors"
          >
            <RiInstagramLine size={28} className="text-white mb-2" />
            <Text className="text-white text-xs font-bbh font-semibold">
              Instagram
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="min-h-24 flex flex-col items-center justify-center p-4 rounded-2xl bg-card-light-100 hover:bg-card-light !transition-colors"
          >
            <RiWhatsappLine size={28} className="text-white mb-2" />
            <Text className="text-white text-xs font-bbh font-semibold">
              WhatsApp
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="min-h-24 flex flex-col items-center justify-center p-4 rounded-2xl bg-card-light-100 hover:bg-card-light !transition-colors"
          >
            <RiTwitterXLine size={28} className="text-white mb-2" />
            <Text className="text-white text-xs font-bbh font-semibold">X</Text>
          </Pressable>
        </View>

        <Button
          label="Download"
          onClick={handleShareAndClose}
          className="w-full !rounded-full !bg-white !text-black"
        />
      </View>
    </View>
  )
}
