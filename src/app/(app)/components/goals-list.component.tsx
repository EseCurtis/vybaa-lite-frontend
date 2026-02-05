import { Input } from '@/components/common/input.component'
import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Goal } from '@/shared/api/goal.api'
import { motion, AnimatePresence } from 'framer-motion'
import { GoalCard } from './goal-card.component'

interface GoalsListProps {
  goals: Goal[]
  filteredGoals: Goal[]
  currentGoal: Goal | null
  searchQuery: string
  isCheckingIn: boolean
  isUpdating: boolean
  isDeleting: boolean
  onSearchChange: (query: string) => void
  onCheckIn: (goalId: string) => void
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
}

export function GoalsList({
  goals,
  filteredGoals,
  currentGoal,
  searchQuery,
  isCheckingIn,
  isUpdating,
  isDeleting,
  onSearchChange,
  onCheckIn,
  onEdit,
  onDelete,
}: GoalsListProps) {
  if (goals.length === 0) {
    return null
  }

  return (
    <View className="space-y-4">
      {/* Search - Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <View className="relative">
          <Icons.Search
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10"
          />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-card-700/50 border-white/5 pl-10 backdrop-blur-sm"
          />
        </View>
      </motion.div>

      {/* Goals Grid */}
      <View className="space-y-2">
        <AnimatePresence>
          {filteredGoals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <View className="bg-card-700/30 rounded-2xl p-6 text-center">
                <Text className="text-white/40 text-sm font-bbh">
                  No matches
                </Text>
              </View>
            </motion.div>
          ) : (
            filteredGoals.map((goal, index) => {
              const isActive = goal.id === currentGoal?.id

              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  isActive={isActive}
                  isCheckingIn={isCheckingIn}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                  onCheckIn={onCheckIn}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
            })
          )}
        </AnimatePresence>
      </View>
    </View>
  )
}
