import { RiCheckLine } from '@remixicon/react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import {
  REWIND_CHAT_ACCENTS,
  getRewindChatAccent,
} from '@/shared/rewind/rewind-chat-accent'
import type { RewindChatAccentId } from '@/shared/rewind/rewind-chat-accent'

export function ChatAppearance({
  value,
  disabled,
  onChange,
}: {
  value: RewindChatAccentId
  disabled: boolean
  onChange: (value: RewindChatAccentId) => void
}): ReactElement {
  const accent = getRewindChatAccent(value)
  return (
    <section aria-labelledby="chat-appearance-title" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="chat-appearance-title"
          className="font-bbh text-base font-bold text-white"
        >
          Message color
        </h2>
        <span className="text-xs text-card-lighter-2">{accent.label}</span>
      </div>
      <div
        aria-label="Message color preview"
        className="flex flex-col gap-3 rounded-3xl bg-card-light-50 p-5"
      >
        <span className="text-center text-xs text-card-lighter-3">
          Preview · only your messages change
        </span>
        <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-card-light px-4 py-3 text-sm text-white">
          A little space to be yourself.
        </div>
        <div
          data-testid="chat-color-preview"
          className="max-w-[85%] self-end rounded-2xl rounded-br-md px-4 py-3 text-sm text-white transition-colors duration-150 motion-reduce:transition-none"
          style={{ backgroundColor: accent.value }}
        >
          Just my kind of conversation.
        </div>
      </div>
      <div
        role="group"
        aria-label="Message colors"
        className="grid grid-cols-3 gap-2"
      >
        {REWIND_CHAT_ACCENTS.map((color) => {
          const selected = value === color.id
          return (
            <Pressable
              key={color.id}
              type="button"
              accessibilityLabel={`${color.label} chat color`}
              aria-pressed={selected}
              disabled={disabled}
              onPress={() => onChange(color.id)}
              className={`min-h-14 min-w-0 flex-row items-center justify-center gap-2 rounded-2xl px-2 py-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected ? 'bg-white text-black' : 'bg-card-light text-card-lighter-1'}`}
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: color.value }}
              >
                {selected ? (
                  <RiCheckLine size={18} className="text-white" />
                ) : null}
              </span>
              {color.label}
            </Pressable>
          )
        })}
      </div>
    </section>
  )
}
