import type { ReactElement } from 'react'

import { View } from '@/components/layout/view.component'
import type { RewindChat } from '@/shared/api/rewind.api'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'
import { cn } from '@/shared/utils/helpers.util'

export function RewindChatAvatar({
  chat,
  className,
}: {
  chat: Pick<RewindChat, 'personaId' | 'type'>
  className?: string
}): ReactElement {
  if (chat.type === 'PARTNER' && chat?.personaId) {
    const persona = getRewindPersona(chat.personaId)
    return (
      <img
        alt={`${persona.name} avatar`}
        className={cn(
          'size-[60px] scale-[1.1] rounded-2xl object-cover',
          className,
        )}
        src={persona.avatar}
      />
    )
  }

  return (
    <View
      aria-label={REWIND_PERSONAS.map((persona) => persona.name).join(', ')}
      className={cn('grid size-[60px] grid-cols-3 gap-0.5', className)}
      role="img"
    >
      {REWIND_PERSONAS.map((persona) => (
        <img
          alt=""
          className="aspect-square min-w-0 rounded-full object-cover"
          key={persona.id}
          src={persona.avatar}
        />
      ))}
    </View>
  )
}
