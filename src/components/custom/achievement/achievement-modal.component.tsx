import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Achievement } from '@/shared/api/achievement.api'
import { motion } from 'framer-motion'

interface AchievementModalProps {
  achievement: Achievement
  onDismiss: () => void
}

export function AchievementModal({ achievement, onDismiss }: AchievementModalProps) {
  return (
    <View className="flex items-center justify-center h-full w-full p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-gradient-to-br from-card-700 to-card-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10"
      >
        {/* Confetti Effect */}
        <View className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: [null, 400],
                x: [null, Math.random() * 200 - 100],
                rotate: [null, Math.random() * 360],
                opacity: [null, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                fontSize: '20px',
              }}
            >
              {['🎉', '⭐', '✨', '🎊', '🌟'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </View>

        {/* Content */}
        <View className="relative z-10 space-y-6 items-center">
          {/* Badge Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            <View className="w-32 h-32 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border-4 border-primary-500/30 shadow-lg shadow-primary-500/20">
              <Text className="text-7xl">{achievement.badgeIcon}</Text>
            </View>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Text className="text-3xl font-bbh font-bold text-white text-center">
              Achievement Unlocked!
            </Text>
          </motion.div>

          {/* Badge Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Text className="text-2xl font-bbh font-bold text-primary-400 text-center">
              {achievement.title}
            </Text>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Text className="text-white/80 text-center font-bbh">
              {achievement.description}
            </Text>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Button
              label="Continue"
              variant="default"
              fullWidth
              onClick={onDismiss}
              className="mt-4"
            />
          </motion.div>
        </View>
      </motion.div>
    </View>
  )
}
