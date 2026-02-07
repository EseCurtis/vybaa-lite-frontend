import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { CreateGoalSheet } from '@/components/custom/goal/create-goal-sheet.component'
import { GoalDetailsSheet } from '@/components/custom/goal/goal-details-sheet.component'
import { GoalList } from '@/components/custom/goal/goal-list.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { goalAPI } from '@/shared/api/goal.api'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useToast } from '@/providers/toast.provider'
import type { Goal } from '@/shared/api/goal.api'
import { 
  RiAddLine, 
  RiCheckboxMultipleLine, 
  RiCloseLine, 
  RiDeleteBin6Line, 
  RiRefreshLine 
} from '@remixicon/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function GoalsAppScreen() {
  const bottomSheet = useBottomSheetController()
  const toast = useToast()
  
  const [refreshKey, setRefreshKey] = useState(0)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreateGoal = () => {
    bottomSheet.present(<CreateGoalSheet onSuccess={bottomSheet.dismiss} />, {
      title: 'New Goal',
    })
  }

  const handleGoalClick = (goal: Goal) => {
    if (bulkMode) {
      // Toggle selection
      setSelectedGoals((prev) => {
        const next = new Set(prev)
        if (next.has(goal.id)) {
          next.delete(goal.id)
        } else {
          next.add(goal.id)
        }
        return next
      })
    } else {
      // Normal click - show details
      bottomSheet.present(
        <GoalDetailsSheet goal={goal} onDismiss={bottomSheet.dismiss} />,
        { title: 'Goal Details' },
      )
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    toast.success('Goals refreshed!')
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedGoals(new Set()) // Clear selections when toggling
  }

  const handleBulkDelete = async () => {
    if (selectedGoals.size === 0) {
      toast.warning('No goals selected')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedGoals.size} goal(s)? This cannot be undone.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const goalIds = Array.from(selectedGoals)
      const response = await goalAPI.bulkDeleteGoals(goalIds)
      
      // Show summary message from backend
      toast.success(response.msg)
      
      // Reset state
      setSelectedGoals(new Set())
      setBulkMode(false)
      setRefreshKey((prev) => prev + 1)
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to delete goals')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <View className=" flex-1 bg-cardd overflow-y-auto no-scrollbar">
      <NoiseComponent>
      <TabHeader title="Goals">
        <AnimatePresence mode="wait">
          {!bulkMode ? (
            <motion.div
              key="normal-actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-row gap-2 items-center"
            >
              <Pressable 
                onPress={handleRefresh} 
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <motion.div whileTap={{ rotate: 180, scale: 0.9 }}>
                  <RiRefreshLine size={20} />
                </motion.div>
              </Pressable>
              
              <Pressable 
                onPress={toggleBulkMode} 
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <RiCheckboxMultipleLine size={20} />
              </Pressable>
              
              <Pressable 
                onPress={handleCreateGoal} 
                className="text-white p-2 hover:bg-primary-500/10 rounded-full transition-colors"
              >
                <RiAddLine size={22} />
              </Pressable>
            </motion.div>
          ) : (
            <motion.div
              key="bulk-actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-row gap-2 items-center"
            >
              <Text className="text-white/60 text-sm font-bbh mr-2">
                {selectedGoals.size} selected
              </Text>
              
              <Pressable 
                onPress={handleBulkDelete} 
                className="text-white p-2 bg-danger-500/20 hover:bg-danger-500/30 rounded-full transition-colors disabled:opacity-50"
                disabled={selectedGoals.size === 0 || isDeleting}
              >
                {isDeleting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RiRefreshLine size={20} color="#ef4444" />
                  </motion.div>
                ) : (
                  <RiDeleteBin6Line size={20} color={selectedGoals.size > 0 ? '#ef4444' : '#ffffff40'} />
                )}
              </Pressable>
              
              <Pressable 
                onPress={toggleBulkMode} 
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <RiCloseLine size={22} />
              </Pressable>
            </motion.div>
          )}
        </AnimatePresence>
      </TabHeader>

      <GoalList 
        key={refreshKey}
        onGoalClick={handleGoalClick} 
        onCreateGoal={handleCreateGoal}
        bulkMode={bulkMode}
        selectedGoals={selectedGoals}
        onToggleSelection={(goalId) => {
          setSelectedGoals((prev) => {
            const next = new Set(prev)
            if (next.has(goalId)) {
              next.delete(goalId)
            } else {
              next.add(goalId)
            }
            return next
          })
        }}
      />
      </NoiseComponent>
    </View>
  )
}
