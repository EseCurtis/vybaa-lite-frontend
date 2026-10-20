import { RiDeleteBin6Line, RiMicFill } from '@remixicon/react'
import moment from 'moment'
import type { ReactElement } from 'react'

import { Skeleton } from '@/components/common/skeleton.component'
import { TextArea } from '@/components/common/textarea.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { VoiceRecordingResult } from '@/plugins/capacitor/plugins/voice-recorder.plugin'

import { MoodSelector } from './mood-selector.component'

interface JournalComposerProps {
  content: string
  date: string
  disabled: boolean
  isLoading: boolean
  isProcessingVoice: boolean
  isRecording: boolean
  mood: string | null
  onContentChange: (content: string) => void
  onDiscardVoiceNote: () => void
  onMoodChange: (mood: string) => void
  onVoiceRecord: () => void
  prompt: string
  voiceNote: VoiceRecordingResult | null
}

export function JournalComposer({
  content,
  date,
  disabled,
  isLoading,
  isProcessingVoice,
  isRecording,
  mood,
  onContentChange,
  onDiscardVoiceNote,
  onMoodChange,
  onVoiceRecord,
  prompt,
  voiceNote,
}: JournalComposerProps): ReactElement {
  const entryDate = moment(date)
  const title = entryDate.isSame(moment(), 'day')
    ? 'Today'
    : entryDate.format('MMMM D')

  return (
    <View className="mx-auto w-full max-w-2xl gap-6 px-5 pb-6 pt-3 sm:px-8">
      <View className="gap-1">
        <h1 className="font-display text-[34px] font-bold leading-tight tracking-tight text-white">
          {title}
        </h1>
        <Text className="font-bbh text-sm text-card-lighter-3">
          {entryDate.format('dddd, MMMM D, YYYY')}
        </Text>
      </View>

      <blockquote className="flex items-start gap-3 rounded-2xl bg-card-light-100 px-4 py-4">
        <span
          aria-hidden="true"
          className="font-display text-[40px] leading-none text-card-lighter-3"
        >
          “
        </span>
        <p
          id="journal-prompt"
          className="font-bbh text-[17px] font-medium leading-relaxed text-white"
        >
          {prompt}
        </p>
      </blockquote>

      {isLoading ? (
        <View role="status" aria-label="Loading journal" className="gap-6">
          <View className="gap-3">
            <Skeleton width={150} height={16} />
            <View className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} height={56} rounded="xl" />
              ))}
            </View>
          </View>
          <View className="min-h-[240px] gap-5 py-2">
            <Skeleton width="85%" height={16} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="65%" height={16} />
          </View>
        </View>
      ) : (
        <>
          <MoodSelector
            selected={mood}
            onSelect={onMoodChange}
            disabled={disabled}
          />
          <View className="gap-3">
            <label
              htmlFor="journal-entry"
              className="font-bbh text-sm font-semibold text-white"
            >
              Your thoughts
            </label>
            <TextArea
              id="journal-entry"
              aria-describedby="journal-prompt journal-character-count"
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Start writing... Let your thoughts flow freely."
              className="min-h-[240px] rounded-2xl bg-card-light-50 !p-4 font-bbh text-[18px] leading-[1.8] text-white placeholder:text-card-lighter-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-card-lighter"
              maxLength={5000}
              disabled={disabled}
            />
            <Text
              id="journal-character-count"
              className="text-right font-bbh text-xs tabular-nums text-card-lighter-3"
            >
              {content.length.toLocaleString()} / 5,000
            </Text>
          </View>
          {isRecording ? (
            <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-2xl bg-card-light-100 p-4">
              <Text
                role="status"
                className="flex items-center gap-2 font-bbh text-sm text-white"
              >
                <RiMicFill size={18} aria-hidden="true" />
                Recording voice note…
              </Text>
              <Pressable
                onPress={onVoiceRecord}
                disabled={isProcessingVoice}
                accessibilityLabel="Stop voice recording"
                className="min-h-11 items-center justify-center rounded-full bg-white px-4 font-bbh text-sm font-semibold text-black"
              >
                Stop recording
              </Pressable>
            </View>
          ) : null}
          {voiceNote ? (
            <View className="gap-3 rounded-2xl bg-card-light-100 p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="gap-1">
                  <Text className="font-bbh text-sm font-semibold text-white">
                    Voice note preview
                  </Text>
                  <Text className="font-bbh text-xs text-card-lighter-3">
                    {Math.max(1, Math.round(voiceNote.durationMs / 1000))}s ·{' '}
                    {voiceNote.mimeType}
                  </Text>
                </View>
                <Pressable
                  onPress={onDiscardVoiceNote}
                  accessibilityLabel="Discard voice note"
                  className="size-11 shrink-0 items-center justify-center rounded-full bg-card-light text-white"
                >
                  <RiDeleteBin6Line size={18} aria-hidden="true" />
                </Pressable>
              </View>
              <audio
                controls
                aria-label="Voice note preview"
                src={voiceNote.audioUrl}
                className="w-full"
              />
              <Text className="font-bbh text-xs leading-relaxed text-card-lighter-3">
                This voice note stays local for now and is not saved with the
                journal entry yet.
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}
