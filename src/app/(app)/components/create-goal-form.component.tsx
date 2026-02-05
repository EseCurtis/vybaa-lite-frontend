import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateGoalFormProps {
  isOpen: boolean
  isCreating: boolean
  formData: {
    goalText: string
    targetDays: string
  }
  formError: string | null
  onClose: () => void
  onFormChange: (data: { goalText: string; targetDays: string }) => void
  onSubmit: () => void
}

export function CreateGoalForm({
  isOpen,
  isCreating,
  formData,
  formError,
  onClose,
  onFormChange,
  onSubmit,
}: CreateGoalFormProps) {
  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.div
          key="create-button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              label="+ New Goal"
              variant="secondary"
              fullWidth
              onClick={onClose}
              className="text-base"
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="create-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <View className="bg-card-700/80 backdrop-blur-xl rounded-3xl p-6 space-y-4">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white text-xl font-bbh font-bold">
                New Goal
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
                  value={formData.goalText}
                  onChange={(e) => {
                    onFormChange({ ...formData, goalText: e.target.value })
                  }}
                  className="min-h-[80px] bg-card-600/50 border-white/10"
                  maxLength={500}
                />
              </View>

              <View>
                <Input
                  type="number"
                  placeholder="Days (1-365)"
                  value={formData.targetDays}
                  onChange={(e) => {
                    onFormChange({ ...formData, targetDays: e.target.value })
                  }}
                  className="bg-card-600/50 border-white/10"
                  min={1}
                  max={365}
                />
              </View>

              {formError && (
                <Text className="text-danger-500 text-sm font-bbh">
                  {formError}
                </Text>
              )}

              <Button
                label="Start"
                variant="default"
                fullWidth
                onClick={onSubmit}
                disabled={isCreating}
                loading={isCreating}
              />
            </View>
          </View>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
