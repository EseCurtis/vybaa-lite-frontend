import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AffirmationSliderProps {
  affirmations: string[]
  isActive: boolean
}

export function AffirmationSlider({ affirmations, isActive }: AffirmationSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isActive || affirmations.length === 0) return

    // Rotate affirmations every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % affirmations.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [affirmations, isActive])

  if (affirmations.length === 0) return null

  const currentAffirmation = affirmations[currentIndex]

  return (
    <View className="h-16 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0.0, 0.2, 1],
          }}
        >
          <Text className="text-white/80 text-lg font-bbh text-center leading-relaxed">
            {currentAffirmation}
          </Text>
        </motion.div>
      </AnimatePresence>
    </View>
  )
}
