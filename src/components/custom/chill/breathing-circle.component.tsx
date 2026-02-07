import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface BreathingCircleProps {
  isActive: boolean
}

export function BreathingCircle({ isActive }: BreathingCircleProps) {
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale')

  useEffect(() => {
    if (!isActive) return

    const cycle = () => {
      setBreathPhase('inhale')
      setTimeout(() => {
        setBreathPhase('exhale')
      }, 4000) // 4 seconds inhale, then switch to exhale
    }

    // Start immediately
    cycle()

    // Repeat every 8 seconds (4s in + 4s out)
    const interval = setInterval(cycle, 8000)

    return () => clearInterval(interval)
  }, [isActive])

  return (
    <View className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={
          {
            //background: 'radial-gradient(circle, #4ECDC4 0%, transparent 70%)',
          }
        }
        animate={{
          scale: breathPhase === 'inhale' ? [1, 1.3, 1] : [1.3, 1, 1.3],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          ease: [0.4, 0.0, 0.2, 1],
          repeat: Infinity,
        }}
      />

      {/* Middle glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-30 blur-2xl"
        style={
          {
            // background: 'radial-gradient(circle, #2DD4BF 0%, transparent 60%)',
          }
        }
        animate={{
          scale: breathPhase === 'inhale' ? [1.1, 1.4, 1.1] : [1.4, 1.1, 1.4],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          ease: [0.4, 0.0, 0.2, 1],
          repeat: Infinity,
          delay: 0.5,
        }}
      />

      {/* Main breathing circle */}
      <View className="scale-[1.5]">
        <motion.div
        key="djdj"
          className="relative w-64 h-64  rounded-full flex items-center justify-center"
          style={{
            // background:
            //   'repeating-radial-gradient(circle, transparent, #4ECDC4, transparent)',
            boxShadow:
              'inset 0 0 120px rgba(45, 212, 191, 0.2), 0 0 120px rgba(45, 212, 191, 0.2)',
          }}
          animate={{
            scale: breathPhase === 'inhale' ? [0.85, 1.15] : [1.15, 0.85],
          }}
          transition={{
            duration: 4,
            ease: [0.4, 0.0, 0.2, 1],
            repeat: Infinity,
          }}
        >
          {/* Inner glow */}
          <View className="absolute inset-4 rounded-full " />
        </motion.div>
      </View>

      {/* Breathing instruction text */}
      <motion.div
        key={breathPhase}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
        className="absolute -top-[10vh] "
      >
        <Text className="text-white text-xl font-bbh font-semibold text-center drop-shadow-lg">
          {breathPhase === 'inhale' ? 'Breathe in...' : 'Breathe out...'}
        </Text>
      </motion.div>
    </View>
  )
}
