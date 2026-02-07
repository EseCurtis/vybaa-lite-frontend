import { NoiseComponent } from '@/components/common/noise.component'
import { TextArea } from '@/components/common/textarea.component'
import { AffirmationSlider } from '@/components/custom/chill/affirmation-slider.component'
import { BreathingCircle } from '@/components/custom/chill/breathing-circle.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCompleteChillSession } from '@/hooks/use-chill.hook'
import { hapticFeedback } from '@/shared/haptic.util'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import { RiPauseLine, RiPlayLine } from '@remixicon/react'
import { useNavigate, useParams, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function ChillTimerScreen() {
  const { sessionId, duration } = useParams({
    from: '/chill/timer/$sessionId/$duration',
  })
  const router = useRouter()
  const navigate = useNavigate()
  const { mutateAsync: completeSession } = useCompleteChillSession()

  // Get affirmations from navigation state
  const affirms = (router.state.location.state as any)?.affirms || [
    'You are safe',
    'Breathe deeply',
    'Take it gently',
  ]

  const durationMs = parseInt(duration) * 60 * 1000
  const [timeRemaining, setTimeRemaining] = useState(durationMs)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [postMood, setPostMood] = useState('')
  const [showMoodInput, setShowMoodInput] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const pausedTimeRef = useRef<number>(0)

  // Timer logic with requestAnimationFrame for accuracy
  useEffect(() => {
    if (isPaused || isCompleted) return

    let rafId: number
    startTimeRef.current = Date.now() - pausedTimeRef.current

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = durationMs - elapsed

      if (remaining <= 0) {
        setTimeRemaining(0)
        handleComplete()
      } else {
        setTimeRemaining(remaining)
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isPaused, isCompleted, durationMs])

  // Handle pause/resume
  const handleTogglePause = () => {
    if (isPaused) {
      startTimeRef.current = Date.now() - pausedTimeRef.current
    } else {
      pausedTimeRef.current = durationMs - timeRemaining
    }
    setIsPaused(!isPaused)
    hapticFeedback.light()
  }

  // Handle completion
  const handleComplete = async () => {
    setIsCompleted(true)
    setShowMoodInput(true)
    hapticFeedback.heavy()
  }

  // Handle mood submission
  const handleMoodSubmit = async () => {
    try {
      await completeSession({
        sessionId,
        postSessionMood: postMood.trim() || undefined,
      })
      navigate({ to: '/app/home-2' })
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  // Handle end session early
  const handleEndSession = () => {
    const confirmed = confirm('Are you sure you want to end this session?')
    if (confirmed) {
      navigate({ to: '/app/home' })
    }
  }

  // Format time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progress = ((durationMs - timeRemaining) / durationMs) * 100

  return (
    <View className="flex-1 bg-cardd flex flex-col items-center justify-center relative p-6">
      <NoiseComponent>
        <View className="flex-1 flex flex-col items-center justify-center gap-12 max-w-md w-full">
          {/* Breathing Circle with Timer */}
          <View className="relative">
            {/* Progress Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 300 300"
            >
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <motion.circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 140}
                initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 140 * (1 - progress / 100),
                }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#4ECDC4" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Breathing Circle */}
            <BreathingCircle isActive={!isPaused && !isCompleted} />

            {/* Timer Text Overlay */}
            <View className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Text className="text-white/40 text-5xl font-bbh font-bold">
                {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>

          {/* Affirmations */}
          <AffirmationSlider
            affirmations={affirms}
            isActive={!isPaused && !isCompleted}
          />
        </View>

        {/* Bottom Controls */}
        <View className="absolute justify-between items-center flex-row gap-3 bottom-12 left-0 right-0 px-6">
          <Button
            label="End Session"
            variant="secondary"
            fullWidth
            onClick={handleEndSession}
            className="bg-white/5 hover:bg-white/10 border-white/10"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTogglePause}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            {isPaused ? (
              <RiPlayLine size={24} className="text-white" />
            ) : (
              <RiPauseLine size={24} className="text-white" />
            )}
          </motion.button>
        </View>

        {/* Completion Overlay */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-cardd/95 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <View className="text-center space-y-6 flex flex-col items-center justify-center px-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <Text className="text-6xl mb-4">
                    <Icon
                      icon={getEmojiIcon('🏆')}
                      className="text-white/60 mb-4"
                      style={{ fontSize: '64px' }}
                    />
                  </Text>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col w-full max-w-xs"
                >
                  <Text className="text-white text-3xl font-bbh font-bold mb-2">
                    Well done
                  </Text>
                  <Text className="text-white/70 text-lg font-bbh mb-4">
                    How do you feel now?
                  </Text>

                  {showMoodInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-4"
                    >
                      <TextArea
                        value={postMood}
                        onChange={(e) => setPostMood(e.target.value)}
                        placeholder="I feel calmer, more relaxed..."
                        className="min-h-[100px] bg-card-700/60 border-white/10 text-white/90 text-base"
                        maxLength={200}
                      />
                      <View className="flex flex-row gap-3">
                        <Button
                          label="Skip"
                          variant="secondary"
                          onClick={handleMoodSubmit}
                          className="flex-1 bg-white/5 hover:bg-white/10"
                        />
                        <Button
                          label="Continue"
                          variant="default"
                          onClick={handleMoodSubmit}
                          className="flex-1 !bg-gradient-to-r !from-cyan-500 !to-teal-500"
                          textClassName="!text-white"
                        />
                      </View>
                    </motion.div>
                  )}
                </motion.div>
              </View>
            </motion.div>
          )}
        </AnimatePresence>
      </NoiseComponent>
    </View>
  )
}
