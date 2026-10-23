import { useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { Input } from '@/components/common/input.component'
import { Pressable } from '@/components/layout/pressables.component'
import { useRenameRewindChat } from '@/hooks/use-rewind.hook'
import { useToast } from '@/providers/toast.provider'

export function ChatNameSheet({
  chatId,
  initialTitle,
  onSaved,
}: {
  chatId: string
  initialTitle: string
  onSaved: () => void
}): ReactElement {
  const [title, setTitle] = useState(initialTitle)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const rename = useRenameRewindChat(chatId)
  const toast = useToast()
  const trimmed = title.trim()

  async function saveName(): Promise<void> {
    if (submitting.current || !trimmed || trimmed === initialTitle) return
    submitting.current = true
    setError(null)
    try {
      await rename.mutateAsync(trimmed)
      toast.success('Group name updated')
      onSaved()
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not update the group name. Try again.',
      )
    } finally {
      submitting.current = false
    }
  }

  return (
    <form
      className="space-y-4 pt-3 pb-2"
      onSubmit={(event) => {
        event.preventDefault()
        void saveName()
      }}
    >
      <label htmlFor="chat-group-name" className="sr-only">
        Group name
      </label>
      <Input
        id="chat-group-name"
        autoFocus
        maxLength={60}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={rename.isPending}
        className="bg-card-light"
        aria-describedby={error ? 'chat-name-error' : undefined}
      />
      {error ? (
        <p
          id="chat-name-error"
          role="alert"
          className="text-sm text-danger-400"
        >
          {error}
        </p>
      ) : null}
      <Pressable
        type="submit"
        accessibilityLabel="Save group name"
        disabled={rename.isPending || !trimmed || trimmed === initialTitle}
        className="min-h-12 w-full items-center justify-center rounded-full bg-white px-4 font-bold text-black disabled:bg-card-light disabled:text-card-lighter-3"
      >
        {rename.isPending ? 'Saving…' : 'Save name'}
      </Pressable>
    </form>
  )
}
