import { RiCheckLine, RiDeleteBin6Line } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { JournalComposer } from '@/components/custom/journal/journal-composer.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import {
  useCreateJournal,
  useDeleteJournal,
  useJournalByDate,
  useUpdateJournal,
} from '@/hooks/use-journal.hook'
import {
  getVoiceRecordingStatus,
  startVoiceRecording,
  stopVoiceRecording,
  type VoiceRecordingResult,
} from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { useToast } from '@/providers/toast.provider'
import { getDailyPrompt } from '@/shared/data/journal-prompts'

export default function JournalEditorScreen({
  date,
}: {
  date: string
}): ReactElement {
  const navigate = useNavigate()
  const toast = useToast()

  const { data: journalData, isLoading } = useJournalByDate(date)
  const { mutateAsync: createJournal, isPending: isCreating } =
    useCreateJournal()
  const { mutateAsync: updateJournal, isPending: isUpdating } =
    useUpdateJournal()
  const { mutateAsync: deleteJournal, isPending: isDeleting } =
    useDeleteJournal()

  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [voiceNote, setVoiceNote] = useState<VoiceRecordingResult | null>(null)

  const journal = journalData?.data?.journal
  const prompt = getDailyPrompt(new Date(date))

  // Load existing journal data
  useEffect(() => {
    if (journal) {
      setContent(journal?.entry || '')
      setMood(journal.mood || null)
    }
  }, [journal])

  // Track changes
  useEffect(() => {
    if (!journal) {
      // For new entries, any content means there are changes
      setHasChanges(
        content.trim().length > 0 || mood !== null || voiceNote !== null,
      )
    } else {
      // For existing entries, check if different from saved
      const changed =
        content !== (journal?.entry || '') || mood !== (journal.mood || null)
      setHasChanges(changed || voiceNote !== null)
    }
  }, [content, mood, journal, voiceNote])

  useEffect(() => {
    let isMounted = true

    void getVoiceRecordingStatus()
      .then((result) => {
        if (isMounted) {
          setIsRecording(result.status === 'RECORDING')
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please write something before saving')
      return
    }

    try {
      if (journal) {
        // Update existing
        await updateJournal({
          journalId: journal.id,
          data: {
            entry: content.trim(),
            mood: mood || undefined,
          },
        })
      } else {
        // Create new
        await createJournal({
          date,
          entry: content.trim(),
          mood: mood || undefined,
        })
      }

      navigate({ to: '/app/journal' })
    } catch (error) {
      console.error('Error saving journal:', error)
      alert('Failed to save journal entry')
    }
  }

  const handleDelete = async () => {
    if (!journal) return

    const confirmed = confirm(
      'Are you sure you want to delete this journal entry?',
    )
    if (!confirmed) return

    try {
      await deleteJournal(journal.id)
      navigate({ to: '/app/journal' })
    } catch (error) {
      console.error('Error deleting journal:', error)
    }
  }

  const handleVoiceRecord = async () => {
    if (isProcessingVoice) return

    setIsProcessingVoice(true)

    try {
      if (isRecording) {
        const recordedAudio = await stopVoiceRecording()
        setVoiceNote(recordedAudio)
        setIsRecording(false)
        toast.success('Voice note recorded')
        return
      }

      await startVoiceRecording()
      setVoiceNote(null)
      setIsRecording(true)
      toast.info('Recording started')
    } catch (error) {
      console.error('Voice recording error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to record voice note',
      )
      setIsRecording(false)
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const discardVoiceNote = () => {
    setVoiceNote(null)
    toast.info('Voice note discarded')
  }

  return (
    <View className="relative min-h-0 flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Journal">
          {journal ? (
            <Pressable
              type="button"
              onPress={handleDelete}
              disabled={isDeleting || isCreating || isUpdating}
              accessibilityLabel="Delete journal entry"
              className="size-11 items-center justify-center rounded-full bg-card-light-100 text-card-lighter-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <RiDeleteBin6Line size={20} aria-hidden="true" />
            </Pressable>
          ) : null}
        </TabHeader>
        <View className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <JournalComposer
            date={date}
            prompt={prompt}
            content={content}
            mood={mood}
            isLoading={isLoading}
            disabled={isCreating || isUpdating || isDeleting}
            onContentChange={setContent}
            onMoodChange={setMood}
            isRecording={isRecording}
            isProcessingVoice={isProcessingVoice}
            voiceNote={voiceNote}
            onVoiceRecord={handleVoiceRecord}
            onDiscardVoiceNote={discardVoiceNote}
          />
        </View>
        {!isLoading ? (
          <View className="shrink-0 bg-cardd px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-8">
            <View className="mx-auto w-full max-w-2xl">
              <Button
                label={journal ? 'Save changes' : 'Save journal'}
                rightIcon={
                  <RiCheckLine
                    size={20}
                    className="text-black"
                    aria-hidden="true"
                  />
                }
                onClick={handleSave}
                disabled={!hasChanges || isDeleting}
                loading={isCreating || isUpdating}
                fullWidth
                buttonClassName="w-full"
              />
            </View>
          </View>
        ) : null}
      </NoiseComponent>
    </View>
  )
}
