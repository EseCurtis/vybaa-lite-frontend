import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Achievement } from '@/shared/api/achievement.api'
import { hapticFeedback } from '@/shared/haptic.util'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

interface AchievementModalProps {
  achievement: Achievement
  onDismiss: () => void
}

export function AchievementModal({ achievement, onDismiss }: AchievementModalProps) {
  const glowControls = useAnimation()

  useEffect(() => {
    // Trigger haptic feedback on mount
    hapticFeedback.heavy()

    // Pulsing glow animation
    glowControls.start({
      scale: [1, 1.05, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    })
  }, [glowControls])

  const handleDismiss = () => {
    hapticFeedback.light()
    onDismiss()
  }

  return (
    <View className="w-full text-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="b rounded-3xl p-8 w-full shadow-2xl relative overflow-hidden"
      >
        {/* Animated Background Glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-transparent rounded-3xl"
          animate={glowControls}
        />

        {/* Confetti Effect - Colored and Full Width */}
        <View className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(40)].map((_, i) => {
            const colors = [
              '#FF6B6B', // red
              '#4ECDC4', // teal
              '#FFE66D', // yellow
              '#95E1D3', // mint
              '#F38181', // pink
              '#AA96DA', // purple
              '#FCBAD3', // light pink
              '#A8E6CF', // light green
              '#FFD93D', // gold
              '#6BCF7F', // green
            ]
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            const size = 8 + Math.random() * 8 // Random size between 8-16px
            const startX = Math.random() * 100 // Full width 0-100%
            const startXPx = `${startX}%`
            const driftAmount = (Math.random() * 100 - 50) // Drift -50px to +50px
            const rotation = Math.random() * 360
            
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: '-30px',
                  left: startXPx, // Position across full width
                }}
                initial={{ 
                  y: 0,
                  x: 0, 
                  opacity: 0, 
                  rotate: rotation, 
                  scale: 0 
                }}
                animate={{
                  y: 500,
                  x: driftAmount,
                  rotate: rotation + (Math.random() * 720 - 360),
                  opacity: [0, 1, 1, 0.5, 0],
                  scale: [0, 1.2, 1, 0.9, 0.7],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {/* Colored confetti square */}
                <View 
                  className="rounded-sm shadow-lg"
                  style={{ 
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: randomColor,
                    boxShadow: `0 0 12px ${randomColor}CC`,
                  }}
                />
              </motion.div>
            )
          })}
        </View>

        {/* Content */}
        <View className="relative z-10 space-y-6 items-center">
          {/* Badge Icon with Glow Effect */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
          >
            <View className="relative">
              {/* Outer glow rings */}
              <motion.div
                className="absolute inset-0 w-32 h-32 rounded-full bg-primary-500/20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute inset-0 w-32 h-32 rounded-full bg-accent-500/20 blur-xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
              
              {/* Main badge container */}
              <View className="relative w-32 h-32 bg-gradient-to-br from-primary-500/30 to-accent-500/30 rounded-full flex items-center justify-center border-4 border-primary-400/40 shadow-2xl">
                {/* Inner glow */}
                <View className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Icon 
                    icon={getEmojiIcon(achievement.badgeIcon)} 
                    className="text-white drop-shadow-2xl relative z-10" 
                    style={{ 
                      fontSize: '72px',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
                    }}
                  />
                </motion.div>
              </View>
            </View>
          </motion.div>

          {/* Title with shimmer effect */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <motion.div
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Text className="text-3xl font-bbh font-bold text-white text-center tracking-tight">
                Achievement Unlocked!
              </Text>
            </motion.div>
          </motion.div>

          {/* Milestone Badge (if applicable) */}
          {achievement.type === 'streak_milestone' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <View className="bg-accent-500/20 border border-accent-400/30 rounded-full px-4 py-1.5">
                <Text className="text-accent-300 font-bbh font-bold text-sm">
                  Day {achievement.milestone}
                </Text>
              </View>
            </motion.div>
          )}

          {/* Badge Title - Enhanced readability */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            <View className="bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
              <Text className="text-3xl font-bbh font-bold text-white text-center leading-tight">
                {achievement.title}
              </Text>
            </View>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Text className="text-white/90 text-center font-bbh text-base leading-relaxed">
              {achievement.description}
            </Text>
          </motion.div>

          {/* Continue Button with pulse */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full pt-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                label="Continue"
                variant="default"
                fullWidth
                onClick={handleDismiss}
                className="!bg-gradient-to-r !from-primary-500 !to-accent-500 shadow-lg shadow-primary-500/30"
                textClassName="font-bold"
              />
            </motion.div>
          </motion.div>

          {/* Earned timestamp */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Text className="text-white/30 text-xs font-bbh text-center">
              Earned {new Date(achievement.earnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </motion.div>
        </View>
      </motion.div>
    </View>
  )
}
