import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateChillSession } from '@/hooks/use-chill.hook'
import type { ChillSuggestion } from '@/shared/api/chill.api'
import { RiHistoryLine, RiMicLine, RiVoiceprintLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

export default function ChillEmotionScreen() {
  const navigate = useNavigate()
  const { mutateAsync: createSession, isPending } = useCreateChillSession()

  const [emotion, setEmotion] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ChillSuggestion[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const handleSubmit = async () => {
    if (!emotion.trim()) return

    try {
      const response = await createSession(emotion)
      setSessionId(response.data.sessionId)
      setSuggestions(response.data.suggestedTimes)
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const handleSelectDuration = (duration: number, affirms: string[]) => {
    if (!sessionId) return

    navigate({
      to: '/chill/timer/$sessionId/$duration',
      params: { sessionId, duration: duration.toString() },
      state: { affirms },
    })
  }

  const handleVoiceRecord = async () => {
    // TODO: Implement voice recording with speech-to-text
    setIsRecording(!isRecording)
  }

  const getDurationLabel = (duration: number): string => {
    const labels: Record<number, string> = {
      5: 'Quick reset',
      10: 'Deep calm',
      20: 'Long unwind',
    }
    return labels[duration] || 'Calming session'
  }

  return (
    <View className="flex-1 bg-cardd">
     

      <NoiseComponent>
        <TabHeader title="Chill">
          <button
            onClick={() => navigate({ to: '/app/wellness' })}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <RiHistoryLine size={20} className="text-white/70" />
          </button>
        </TabHeader>
        <View className="flex-1 px-4 pb-[120px] pt-6 max-w-2xl mx-auto">
          {/* Time Pills - Appear after submission */}
          <AnimatePresence>
            {sessionId && suggestions.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <Text className="text-white/70 text-lg font-bbh font-bold mb-4 text-center">
                  Choose your session
                </Text>

                <View className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.duration}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          handleSelectDuration(
                            suggestion.duration,
                            suggestion.affirms,
                          )
                        }
                        className="w-full bg-gradient-to-b from-cyan-500/20 to-transparent hover:from-cyan-500/30 hover:to-transparent  rounded-2xl p-6 transition-all"
                      >
                        <View className="flex flex-row items-center justify-between">
                          <View className="flex-1 text-left">
                            <View className="flex flex-row items-baseline gap-2 mb-1">
                              <Text className="text-white text-3xl font-bbh font-bold">
                                {suggestion.duration}
                              </Text>
                              <Text className="text-cyan-300/80 text-base font-bbh">
                                minutes
                              </Text>
                            </View>
                            <Text className="text-cyan-200/70 text-sm font-bbh">
                              {getDurationLabel(suggestion.duration)}
                            </Text>
                          </View>

                          <View className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <RiVoiceprintLine
                              size={24}
                              className="text-cyan-300"
                            />
                          </View>
                        </View>

                        <Text className="text-cyan-100/50 text-xs font-bbh mt-3 italic text-left">
                          "{suggestion.affirms[0]}"
                        </Text>
                      </motion.button>
                    </motion.div>
                  ))}
                </View>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                {/* Emotion Input Section */}
                <View className="">
                  <Text className="text-white/50 text-sm font-bbh mb-0 text-center">
                    Take a moment to express yourself
                  </Text>
                  <Text className="text-white/90 text-2xl font-bbh mb-6 font-bold  text-center">
                    How are you feeling right now?
                  </Text>
                </View>

                <TextArea
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  placeholder="I'm feeling anxious about work..."
                  className="min-h-[120px] rounded-2xl text-center border-white/20 border pt-3 text-white/90 mb-4 text-base"
                  maxLength={500}
                  disabled={!!sessionId}
                />

                <View className="flex flex-row gap-3 ">
                  <Button
                    label=""
                    leftIcon={<RiMicLine size={20} />}
                    variant="secondary"
                    onClick={handleVoiceRecord}
                    className="flex-shrink-0"
                    disabled={!!sessionId || isPending}
                  />

                  {!sessionId && (
                    <Button
                      label="Continue"
                      variant="default"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={!emotion.trim() || isPending}
                      loading={isPending}
                      style={{
                        width: '100%',
                      }}
                    />
                  )}
                </View>
              </motion.div>
            )}
          </AnimatePresence>
        </View>
      </NoiseComponent>
    </View>
  )
}
