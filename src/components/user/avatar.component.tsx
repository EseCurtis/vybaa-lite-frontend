/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { User } from '@/shared/types/auth.types'
import { cn } from '@/shared/utils/helpers.util'
import { Text } from '../layout/text.component'
import { View } from '../layout/view.component'

export function Avatar({
  user,
  url,
  size = 30,
  className,
}: {
  user?: User
  url?: string
  size?: number | string
  className?: string
}) {
  const initials = [
    user?.firstName?.[0] || user?.username?.[0],
    user?.lastName?.[0] || user?.firstName?.[1] || user?.username?.[1],
  ].join('')

  const avatarUrl = user?.avatarUrl || url
  return (
    <View
      className={cn(
        'rounded-full relative overflow-hidden flex place-content-center items-center justify-center',
        className,
      )}
      style={{
        width: size,
        aspectRatio: '1/1',
      }}
    >
      <Text className="absolute text-card-50 font-bbh size-full top-0 left-0 bg-card-600 flex place-content-center items-center justify-center">
        <span className=' '>{initials}</span>
      </Text>
      <img src={avatarUrl} className="size-full object-fill relative z-10" />
    </View>
  )
}
