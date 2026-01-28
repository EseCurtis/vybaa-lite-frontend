import { Icons, Icon as LIcon } from '@/components/layout/icon.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateJournal, useJournalByDate, useUpdateJournal } from '@/hooks/use-journal.hook'
import { useEffect, useMemo, useState } from 'react'
import { TopNotch } from '../common/notch.component'

function useTTS() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const speak = (text: string) => {
    if (!synth) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    utter.pitch = 1
    synth.cancel()
    synth.speak(utter)
  }
  const stop = () => synth?.cancel()
  return { speak, stop }
}

const moods = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'meh', emoji: '😐', label: 'Meh' },
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'stressed', emoji: '😵‍💫', label: 'Stressed' },
]

const JOURNAL_INFO_KEY = 'journal_info_seen'

export function JournalInsightModal({ onClose }: { onClose?: () => void }) {
  const {  stop } = useTTS()
  const [mood, setMood] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [text, setText] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  
  // Get today's date in YYYY-MM-DD format
  const todayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  // Load existing journal for today
  const { data: existingJournal } = useJournalByDate(todayDate)
  const createJournal = useCreateJournal()
  const updateJournal = useUpdateJournal()

  // Check if user has seen the info banner
  useEffect(() => {
    const hasSeenInfo = localStorage.getItem(JOURNAL_INFO_KEY)
    if (!hasSeenInfo) {
      setShowInfo(true)
    }
  }, [])

  // Initialize form with existing journal data
  useEffect(() => {
    if (existingJournal?.data?.journal) {
      const journal = existingJournal.data.journal
      setMood(journal.mood || null)
      setText(journal.entry)
      // Rating is not stored in the backend, so we keep it at 0
    }
  }, [existingJournal])

  const handleDismissInfo = () => {
    setShowInfo(false)
    localStorage.setItem(JOURNAL_INFO_KEY, 'true')
  }


  useEffect(() => () => stop(), [stop])

  const handleSave = async () => {
    if (!text.trim()) {
      // Could show an error toast here
      return
    }

    const isUpdating = existingJournal?.data?.journal

    try {
      if (isUpdating) {
        await updateJournal.mutateAsync({
          journalId: existingJournal.data.journal.id,
          data: {
            mood: mood || undefined,
            entry: text.trim(),
          },
        })
      } else {
        await createJournal.mutateAsync({
          date: todayDate,
          mood: mood || undefined,
          entry: text.trim(),
        })
      }
      onClose?.()
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to save journal:', error)
    }
  }

  const isLoading = createJournal.isPending || updateJournal.isPending

  
  


  return (
    <View className="absolute inset-0 bg-[#0b0b0b]">
      {/* Header */}
      <TopNotch/>
       <TopNotch/>
      <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-[#1d1d1d]">
        <Text className="text-white font-bbh text-xl">Daily<br /> Check  In</Text>
        <div className="flex items-center gap-2">
          {/* <TouchableOpacity className="rounded-full border border-[#2a2a2a] p-2" onPress={() => speak(prompt)}>
            <Icons.Play size={16} className="text-white/80" />
          </TouchableOpacity> */}
          <TouchableOpacity className="rounded-full border border-[#2a2a2a] p-2" onPress={onClose}>
            <Icons.X size={16} className="text-white/80" />
          </TouchableOpacity>
        </div>
      </View>

      {/* Content */}
      <View className="py-5 overflow-y-auto h-[calc(100vh-140px)]">
        {/* First-time info banner */}
        {showInfo && (
          <View className="mb-5 mx-5">
            <View className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 relative">
              <TouchableOpacity
                className="absolute top-2 right-2 p-1"
                onPress={handleDismissInfo}
              >
                <Icons.X size={16} className="text-white/60" />
              </TouchableOpacity>
              <View className="pr-6">
                <View className="flex-row items-center gap-2 mb-2">
                  <Icons.Info size={18} className="text-accent-400" />
                  <Text className="text-white font-bbh text-base">How we use your journals</Text>
                </View>
                <Text className="text-white/80 font-outfit text-sm leading-relaxed">
                  We analyze your last 10 journal entries to understand your emotional patterns and automatically update your mood profile. This helps us personalize your daily insights and provide better support. Your entries are private and secure.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Mood selector */}
        <View className="mb-5 ">
          <Text className="text-white/80 font-bbh-mini-2 mb-2 px-5">How are you feeling?</Text>
          <div className="flex flex-row gap-2 max-w-full overflow-x-scroll pl-5 pr-12 no-scrollbar" style={{
             maskImage: `linear-gradient(to left, transparent 0%, transparent -10%, black 20%)`,
          }}>
         
            {moods.map((m) => (
              <TouchableOpacity
                key={m.key}
                className={`px-3 py-2 rounded-xl border ${mood === m.key ? 'border-accent-500 bg-accent-500/10' : 'border-[#2a2a2a] bg-[#121212]'}`}
                onPress={() => setMood(m.key)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.emoji}</span>
                  <Text className="text-white/80 text-sm">{m.label}</Text>
                </div>
              </TouchableOpacity>
            ))}
          </div>
        </View>

        {/* Rating */}
        <View className="mb-5 px-5">
          <Text className="text-white/80 font-bbh-mini-2 mb-2">Rate your day</Text>
          <div className="flex flex-row items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                <LIcon name="Flame" size={25} className={i < rating ? 'text-[#ff7849]' : 'text-white/20'} fill={i < rating ? '#ff7849' : 'transparent'} />
              </TouchableOpacity>
            ))}
          </div>
        </View>

        {/* Journal text */}
        <View className="mb-5  px-5">
          <Text className="text-white/80 font-bbh-mini-2 mb-2">Tell us about your day</Text>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A few lines on your wins, challenges, and how you feel."
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 min-h-[140px] resize-y"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <Text className="text-white/50 text-xs">{text.length}/1000</Text>
            </div>
          </div>
          
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row gap-3 px-5 pb-5 ">
        <TouchableOpacity
          className="flex-1 bg-card-600 hover:bg-card-500 rounded-xl py-3 flex justify-center text-center disabled:opacity-50"
          onPress={onClose}
          disabled={isLoading}
        >
          <Text className="text-white font-bbh">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-accent-600 hover:bg-accent-500 rounded-xl py-3 text-center flex justify-center disabled:opacity-50"
          onPress={handleSave}
          disabled={isLoading || !text.trim()}
        >
          <Text className="text-white font-bbh">
            {isLoading ? 'Saving...' : existingJournal?.data?.journal ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}


