import { Icon } from '@iconify/react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { randomGreetings } from '@/shared/home/home.util.shared'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'

export function HomeGreetings({ userName }: { userName: string }) {
  const greetings = randomGreetings(userName.split(' ')[0])
  const emoji = greetings[2]

  return (
    <View className=" px-mg text-left py-5 relative ">
      <View className="flex-row-reverse gap-3 items-center">
        <View className="size-12 bg-red-500 rounded-full"></View>
        <View className="relative z-10 h-full my-auto flex-col  items-start bg-cardx p-2 px-4 rounded-3xl justify-center ">
          <Text className="text-contrast-outline font-mona-sans-x block truncate font-bold text-card-lighter-2 text-lg">
            {greetings[0]}
          </Text>
          <View className="flex-row min-w-0 items-center justify-start gap-2">
            <Text className="text-contrast-outline leading-tight font-mona-sans-x min-w-0 font-bold text-card-lighter/70 text-lg">
              {greetings[1]}
            </Text>
          </View>
          <View className="bg-cardx p-3 rounded-full absolute bottom-0 -right-3"></View>
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
