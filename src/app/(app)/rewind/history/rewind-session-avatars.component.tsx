import type { ReactElement } from 'react'

import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { RewindPersona } from '@/shared/rewind/rewind-personas'
import type { User } from '@/shared/types/auth.types'

export function RewindSessionAvatars({
  persona,
  user,
}: {
  persona: RewindPersona
  user?: User
}): ReactElement {
  return (
    <View aria-hidden="true" className="relative size-16 shrink-0">
      <View className="absolute left-0 top-0 size-12">
        <Avatar user={user} size={48} />
      </View>
      <View className="absolute bottom-0 right-0 size-10 rounded-full bg-cardd p-[3px]">
        <img
          src={persona.avatar}
          alt=""
          width={34}
          height={34}
          className="size-full rounded-full bg-card-light-100 object-cover"
        />
      </View>
    </View>
  )
}
