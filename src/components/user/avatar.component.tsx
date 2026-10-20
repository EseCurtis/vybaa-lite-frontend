import { useState } from 'react'
import type { ReactElement } from 'react'

import type { User } from '@/shared/types/auth.types'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import { Text } from '../layout/text.component'
import { View } from '../layout/view.component'

export type AvatarUser = {
  [Key in 'avatarUrl' | 'firstName' | 'id' | 'lastName' | 'username']?:
    | User[Key]
    | null
}

export function Avatar({
  user,
  url,
  size = 30,
  className,
  previewUrl,
}: {
  user?: AvatarUser
  url?: string
  previewUrl?: string
  size?: number | string
  className?: string
}): ReactElement {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const initials =
    [
      user?.firstName?.[0] || user?.username?.[0],
      user?.lastName?.[0] || user?.firstName?.[1] || user?.username?.[1],
    ].join('') || 'U'

  const avatarUrl = previewUrl || user?.avatarUrl || url
  const showImage = Boolean(avatarUrl) && avatarUrl !== failedUrl
  const color = seededColor(JSON.stringify(user) ?? '')
  const darkerColor = adjustColor(color, { lightness: -30, saturation: -20 })
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'User'
  return (
    <View
      role="img"
      aria-label={`${name} avatar`}
      className={cn(
        'shrink-0 rounded-full relative overflow-hidden flex place-content-center items-center justify-center',
        className,
      )}
      style={{ width: size, aspectRatio: '1/1', background: color }}
    >
      <Text
        aria-hidden="true"
        className="absolute font-bbh size-full top-0 left-0 flex place-content-center items-center justify-center"
      >
        <span
          className="font-bold"
          style={{
            color: darkerColor,
            fontSize:
              typeof size === 'number'
                ? Math.max(12, Math.round(size * 0.32))
                : 12,
          }}
        >
          {initials}
        </span>
      </Text>
      {showImage ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailedUrl(avatarUrl ?? null)}
          className="size-full object-cover relative z-10"
        />
      ) : null}
    </View>
  )
}
