import { Icon } from '@iconify/react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { randomGreetings } from '@/shared/home/home.util.shared'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'

export function HomeGreetings({ userName }: { userName: string }) {
  const greetings = randomGreetings(userName.split(' ')[0])
  const emoji = greetings[2]

  return (
    <View className=" px-mg text-center py-10 relative ">
      <View className="relative z-10 h-full my-auto flex-col items-center justify-center ">
        <Text className="text-contrast-outline block truncate font-bold text-card-lighter-2 text-2xl">
          {greetings[0]}
        </Text>
        <View className="flex-row min-w-0 items-center justify-center gap-2">
          <Text className="text-contrast-outline min-w-0 font-bold text-card-lighter/70 text-3xl">
            {greetings[1]}
          </Text>
        </View>
      </View>


      {emoji && (
        <View className="absolute -bottom-[20px] hidden opacity-90 right-mg ">
          <Icon
            aria-hidden="true"
            className="shrink-0"
            height={70}
            icon={getEmojiIcon(emoji)}
          />
        </View>
      )}
    </View>
  )
}
