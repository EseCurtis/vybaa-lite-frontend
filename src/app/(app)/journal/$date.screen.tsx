import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { TextArea } from '@/components/common/textarea.component'
import { MoodSelector } from '@/components/custom/journal/mood-selector.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCreateJournal,
  useDeleteJournal,
  useJournalByDate,
  useUpdateJournal,
} from '@/hooks/use-journal.hook'
import { useToast } from '@/providers/toast.provider'
import {
  getVoiceRecordingStatus,
  startVoiceRecording,
  stopVoiceRecording,
  type VoiceRecordingResult,
} from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { getDailyPrompt } from '@/shared/data/journal-prompts'
import {
  RiDeleteBin6Line,
  RiMicFill,
  RiMicLine,
  RiSaveLine,
  RiStopCircleLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import moment from 'moment'
import { useEffect, useState } from 'react'

export default function JournalEditorScreen({ date }: { date: string }) {
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
      console.log('Saving journal...', {
        hasJournal: !!journal,
        content,
        mood,
        date,
      })

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

      console.log('Journal saved successfully')
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
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title={moment(date).format('MMM D, YYYY')}>
          <View className="flex flex-row gap-2">
            {journal && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-full bg-danger-500/20 hover:bg-danger-500/30 transition-colors"
              >
                <RiDeleteBin6Line size={18} className="text-danger-400" />
              </button>
            )}
            <motion.button
              onClick={handleSave}
              disabled={!hasChanges || isCreating || isUpdating}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-white/30 hover:scale-105"
              whileTap={{ scale: 0.95 }}
            >
              {isCreating || isUpdating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RiSaveLine size={20} className="text-cardd" />
                </motion.div>
              ) : (
                <RiSaveLine size={20} className="text-cardd" />
              )}
            </motion.button>
          </View>
        </TabHeader>

        <View className="flex-1 px-4 pb-[120px] pt-6 max-w-2xl mx-auto overflow-y-auto">
          {isLoading ? (
            <View className="flex-1 flex items-center justify-center">
              <Text className="text-white/50 font-bbh">Loading...</Text>
            </View>
          ) : (
            <View className="space-y-6">
              {/* Daily Prompt */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-2xl p-4 "
              >
                <Text className="text-pink-200/70 text-sm font-bbh italic">
                  "{prompt}"
                </Text>
              </motion.div>

              {/* Mood Selector */}
              <MoodSelector selected={mood} onSelect={setMood} />

              {/* Journal Content */}
              <View className="space-y-3">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-white/70 text-sm font-bbh">
                    Your thoughts
                  </Text>
                  <button
                    onClick={handleVoiceRecord}
                    disabled={isProcessingVoice}
                    className={`p-2 rounded-full transition-colors disabled:opacity-60 ${
                      isRecording
                        ? 'bg-danger-500/20 hover:bg-danger-500/30'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {isRecording ? (
                      <RiStopCircleLine size={16} className="text-danger-300" />
                    ) : (
                      <RiMicLine size={16} className="text-white/70" />
                    )}
                  </button>
                </View>

                {isRecording && (
                  <View className="rounded-2xl border border-danger-400/20 bg-danger-500/10 px-4 py-3">
                    <View className="flex flex-row items-center gap-2">
                      <RiMicFill size={16} className="text-danger-300" />
                      <Text className="text-danger-100 text-sm font-bbh">
                        Recording voice note... tap the mic again to stop.
                      </Text>
                    </View>
                  </View>
                )}

                {voiceNote && (
                  <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 space-y-3">
                    <View className="flex flex-row items-center justify-between gap-3">
                      <View>
                        <Text className="text-white/90 text-sm font-bbh">
                          Voice note preview
                        </Text>
                        <Text className="text-white/50 text-xs font-bbh">
                          {Math.max(1, Math.round(voiceNote.durationMs / 1000))}
                          s{' • '}
                          {voiceNote.mimeType}
                        </Text>
                      </View>

                      <button
                        onClick={discardVoiceNote}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <RiDeleteBin6Line size={16} className="text-white/70" />
                      </button>
                    </View>

                    <audio
                      controls
                      src={voiceNote.audioUrl}
                      className="w-full"
                    />

                    <Text className="text-white/45 text-xs font-bbh">
                      This voice note stays local for now and is not saved with
                      the journal entry yet.
                    </Text>
                  </View>
                )}

                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing... Let your thoughts flow freely."
                  className="min-h-[300px] bg-card-700/60 border-white/10 text-white/90 text-base"
                  maxLength={5000}
                />

                <Text className="text-white/40 text-xs font-bbh text-right">
                  {content.length} / 5000
                </Text>
              </View>
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
