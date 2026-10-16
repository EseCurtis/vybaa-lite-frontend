import { useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export function CustomRewindAnswerSheet({
  question,
  initialValue,
  onSave,
}: {
  question: string
  initialValue: string
  onSave: (answer: string) => Promise<void>
}): ReactElement {
  const [answer, setAnswer] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    if (!answer.trim() || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      await onSave(answer.trim())
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save your answer. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View className="gap-4 py-3">
      <Text className="font-display text-lg font-bold leading-7 text-white">
        “{question}”
      </Text>
      <label
        htmlFor="rewind-custom-answer"
        className="font-bbh text-sm text-card-lighter-2"
      >
        In your own words
      </label>
      <textarea
        id="rewind-custom-answer"
        autoFocus
        rows={5}
        maxLength={2000}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        disabled={isSaving}
        placeholder="There's no perfect answer. Just yours."
        className="w-full resize-none rounded-2xl bg-card-light p-4 font-bbh text-base leading-6 text-white outline-none placeholder:text-card-lighter-3 focus-visible:ring-2 focus-visible:ring-white"
      />
      <Text className="font-bbh text-right text-xs text-card-lighter-3">
        {answer.length}/2000
      </Text>
      {error ? (
        <Text role="alert" className="font-bbh text-sm text-card-lighter-2">
          {error}
        </Text>
      ) : null}
      <Pressable
        onPress={() => void save()}
        disabled={!answer.trim() || isSaving}
        className="min-h-12 items-center justify-center rounded-full bg-white px-6"
        accessibilityLabel="Use my custom Rewind answer"
      >
        <Text className="font-bbh font-bold text-black">
          {isSaving ? 'Saving your answer…' : 'Use my answer'}
        </Text>
      </Pressable>
    </View>
  )
}
