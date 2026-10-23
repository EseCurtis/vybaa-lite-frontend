import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from '@remixicon/react'
import { useEffect, useState } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import {
  defaultHomeActionPreferences,
  moveHomeAction,
} from '@/shared/home/home-action-preferences'
import type { HomeActionPreferences } from '@/shared/home/home-action-preferences'

import type { HomeAction } from './home-actions.component'

export function HomeActionsSheet({
  actions,
  initial,
  onSave,
  onClosed,
}: {
  actions: HomeAction[]
  initial: HomeActionPreferences
  onSave: (preferences: HomeActionPreferences) => void
  onClosed: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const ordered = draft.order.flatMap((id) =>
    actions.filter((action) => action.id === id),
  )
  const available = actions.map((action) => action.id)
  useEffect(() => onClosed, [onClosed])

  return (
    <div className="space-y-4 pt-3 pb-2">
      <p className="text-sm leading-6 text-card-lighter-3">
        Show what you use. Put your favourites first.
      </p>
      <ol aria-label="Home shortcut order" className="space-y-3">
        {ordered.map((action, position) => {
          const selected = !draft.hidden.includes(action.id)
          const Icon = action.icon
          return (
            <li key={action.id} className="flex items-center gap-1">
              <Pressable
                type="button"
                accessibilityRole="checkbox"
                aria-checked={selected}
                accessibilityLabel={`Show ${action.name.trim()}`}
                onPress={() => {
                  setError(null)
                  setDraft((previous) => ({
                    ...previous,
                    hidden: selected
                      ? [...previous.hidden, action.id]
                      : previous.hidden.filter((id) => id !== action.id),
                  }))
                }}
                className={`min-h-14 min-w-0 flex-1 flex-row items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold active:!scale-[0.98] motion-reduce:!transform-none ${selected ? 'bg-white text-black' : 'bg-card-light-100 text-card-lighter-3'}`}
              >
                <Icon aria-hidden="true" size={20} className="shrink-0" />
                <span className="min-w-0 flex-1 break-words text-sm">
                  {action.name}
                </span>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-cardd text-white' : 'bg-card-lighter'}`}
                  aria-hidden="true"
                >
                  {selected ? <RiCheckLine size={14} /> : null}
                </span>
              </Pressable>
              <Pressable
                type="button"
                accessibilityLabel={`Move ${action.name.trim()} earlier`}
                disabled={!position}
                onPress={() =>
                  setDraft((previous) =>
                    moveHomeAction(previous, action.id, -1, available),
                  )
                }
                className="size-11 shrink-0 items-center justify-center rounded-full text-card-lighter-3 disabled:text-card-lighter active:!scale-95 motion-reduce:!transform-none"
              >
                <RiArrowUpSLine size={22} />
              </Pressable>
              <Pressable
                type="button"
                accessibilityLabel={`Move ${action.name.trim()} later`}
                disabled={position === ordered.length - 1}
                onPress={() =>
                  setDraft((previous) =>
                    moveHomeAction(previous, action.id, 1, available),
                  )
                }
                className="size-11 shrink-0 items-center justify-center rounded-full text-card-lighter-3 disabled:text-card-lighter active:!scale-95 motion-reduce:!transform-none"
              >
                <RiArrowDownSLine size={22} />
              </Pressable>
            </li>
          )
        })}
      </ol>
      <Pressable
        type="button"
        onPress={() => {
          setDraft(defaultHomeActionPreferences())
          setError(null)
        }}
        className="min-h-11 items-center justify-center px-2 text-sm font-semibold text-card-lighter-3"
      >
        Restore defaults
      </Pressable>
      {error ? (
        <p role="alert" className="text-sm leading-6 text-danger-400">
          {error}
        </p>
      ) : null}
      <Pressable
        type="button"
        onPress={() => {
          try {
            onSave(draft)
          } catch {
            setError(
              'Couldn’t save on this device. Your changes are kept here—try again.',
            )
          }
        }}
        className="min-h-12 w-full items-center justify-center rounded-full bg-white px-5 font-bold text-black active:!scale-[0.97] motion-reduce:!transform-none"
      >
        Save shortcuts
      </Pressable>
      <p className="text-center text-xs leading-5 text-card-lighter-3">
        Saved for your account on this device.
      </p>
    </div>
  )
}
