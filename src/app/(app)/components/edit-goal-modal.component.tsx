import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Goal } from '@/shared/api/goal.api'
import { motion, AnimatePresence } from 'framer-motion'

interface EditGoalModalProps {
  editingGoal: Goal | null
  isUpdating: boolean
  editFormData: {
    goalText: string
    targetDays: string
  }
  onClose: () => void
  onFormChange: (data: { goalText: string; targetDays: string }) => void
  onSubmit: () => void
}

export function EditGoalModal({
  editingGoal,
  isUpdating,
  editFormData,
  onClose,
  onFormChange,
  onSubmit,
}: EditGoalModalProps) {
  return (
    <AnimatePresence>
      {editingGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card-700 rounded-3xl p-6 w-full max-w-md space-y-4"
          >
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white text-xl font-bbh font-bold">
                Edit Goal
              </Text>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icons.X size="sm" color="#ffffff" />
              </button>
            </View>

            <View className="space-y-4">
              <View>
                <TextArea
                  placeholder="What's your commitment?"
                  value={editFormData.goalText}
                  onChange={(e) => {
                    onFormChange({ ...editFormData, goalText: e.target.value })
                  }}
                  className="min-h-[80px] bg-card-600/50 border-white/10"
                  maxLength={500}
                />
              </View>

              <View>
                <Input
                  type="number"
                  placeholder="Days (1-365)"
                  value={editFormData.targetDays}
                  onChange={(e) => {
                    onFormChange({ ...editFormData, targetDays: e.target.value })
                  }}
                  className="bg-card-600/50 border-white/10"
                  min={1}
                  max={365}
                />
              </View>

              <Button
                label="Save"
                variant="default"
                fullWidth
                onClick={onSubmit}
                disabled={isUpdating}
                loading={isUpdating}
              />
            </View>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
