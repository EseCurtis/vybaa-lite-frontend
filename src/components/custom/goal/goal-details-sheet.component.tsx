import { BottomNotch } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useDeleteGoal } from '@/hooks/use-goals.hook'
import { useCheckInWithAchievements } from '@/hooks/use-checkin-with-achievements.hook'
import { useToast } from '@/providers/toast.provider'
import type { Goal } from '@/shared/api/goal.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { seededColor } from '@/shared/utils/helpers.util'
import { Icon } from '@iconify/react'
import { RiDeleteBinLine, RiFireFill, RiImageLine, RiCheckLine, RiEditLine } from '@remixicon/react'
import moment from 'moment'
import { useState } from 'react'
import { GoalDurationPill } from './duration-pill.component'
import { AttachmentPicker, type Attachment } from './attachment-picker.component'
import { motion, AnimatePresence } from 'framer-motion'

// Helper function to format reminder time (HH:MM to 12-hour format)
function formatReminderTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

interface GoalDetailsSheetProps {
  goal: Goal
  onDismiss?: () => void
  onEdit?: (goal: Goal) => void
}

export function GoalDetailsSheet({
  goal,
  onDismiss,
  onEdit,
}: GoalDetailsSheetProps) {
  const toast = useToast()
  const color = seededColor(goal.goalText)
  const { checkIn, isCheckingIn } = useCheckInWithAchievements()
  const { mutate: deleteGoal, isPending: isDeleting } = useDeleteGoal()
  
  const [showCheckInForm, setShowCheckInForm] = useState(false)
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const progressPercentage = Math.min(
    (goal.currentDay / goal.targetDays) * 100,
    100,
  )

  const handleCheckIn = async () => {
    if (!goal.canCheckIn) return
    
    if (!showCheckInForm) {
      // Show check-in form
      setShowCheckInForm(true)
      return
    }

    // Submit check-in with notes and attachments
    try {
      const notesToSend = notes.trim() || undefined
      const attachmentsToSend = attachments.length > 0 ? attachments : undefined
      await checkIn(goal.id, notesToSend, attachmentsToSend)
      
      // Reset form and close
      setNotes('')
      setAttachments([])
      setShowCheckInForm(false)
      onDismiss?.()
    } catch (err: any) {
      // Error toast handled in hook
    }
  }


  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.',
      )
    ) {
      return
    }

    deleteGoal(goal.id, {
      onSuccess: () => {
        onDismiss?.()
      },
    })
  }

  const handleEdit = () => {
    onEdit?.(goal)
    onDismiss?.()
  }

  return (
    <View className="space-y-5 pb-4">
      {/* Goal Card with Color */}
      <View className="flex-row gap-3 overflow-x-scroll w-full no-scrollbar snap-x snap-mandatory">
        <View
          className="rounded-3xl shrink-0 p-6 w-full snap-center"
          style={{ backgroundColor: color }}
        >
          <Text className="text-card-lighter text-sm font-bold font-bbh mb-4 leading-tight">
            {goal.goalText}
          </Text>

          <View className="flex-row items-center justify-between mb-4">
            <GoalDurationPill
              currentDay={goal.currentDay}
              targetDays={goal.targetDays}
            />

            <Text className="text-card-lighter/60 text-sm font-bbh">
              {Math.round(progressPercentage)}% complete
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-card-lighter/10 rounded-full overflow-hidden">
            <View
              className="h-full bg-card-lighter/30 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
        </View>
        
        {/* Delete Action */}
        <View className="flex-row shrink-0 items-center justify-center snap-center">
          <View className="w-[70px] h-full flex-row items-center justify-center">
            <Pressable
              className="p-1.5 bg-pink-900/30 rounded-xl aspect-square size-full flex flex-row items-center justify-center transition-colors hover:bg-pink-900/40"
              disabled={isDeleting || isCheckingIn}
              onPress={handleDelete}
            >
              <RiDeleteBinLine className="text-pink-500" size={20} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Check-in Section */}
      <AnimatePresence mode="wait">
        {!showCheckInForm ? (
          <motion.div
            key="checkin-button"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {goal.canCheckIn ? (
              <Pressable
                onPress={handleCheckIn}
                disabled={isCheckingIn || isDeleting}
                className="w-full bg-green-500/20 hover:bg-green-500/30 rounded-2xl p-4 flex-row items-center justify-center gap-2 transition-colors border border-green-500/30"
              >
                <RiFireFill className="text-green-400" size={20} />
                <Text className="text-green-400 text-sm font-bbh font-bold">
                  Check In
                </Text>
              </Pressable>
            ) : (
              <View className="w-full bg-green-500/10 rounded-2xl p-4 flex-row items-center justify-center gap-2 border border-green-500/20">
                <RiCheckLine className="text-green-400" size={20} />
                <Text className="text-green-400 text-sm font-bbh font-semibold">
                  Already checked in today
                </Text>
              </View>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="checkin-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Notes Section */}
            <View className="space-y-3">
              <View className="flex-row items-center gap-2">
                <Icon icon="mdi:text-box-outline" className="text-white/70" style={{ fontSize: '18px' }} />
                <Text className="text-white/80 text-sm font-bbh font-semibold">
                  Notes (Optional)
                </Text>
              </View>
              <View className="bg-cardd-light/40 rounded-xl p-3">
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it go? What did you learn?"
                  className="min-h-[100px] w-full text-white placeholder:text-white/40"
                  maxLength={500}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <AttachmentPicker
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  maxAttachments={5}
                />
                <Text className="text-white/40 text-xs font-bbh">
                  {notes.length}/500
                </Text>
              </View>
            </View>

            {/* Check In Button */}
            <View className="pt-2">
              <Pressable
                onPress={handleCheckIn}
                disabled={isCheckingIn || isDeleting}
                className="w-full bg-card-lighter hover:bg-card-lighter/90 rounded-xl py-4 px-6 flex-row items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingIn ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RiFireFill className="text-cardd" size={20} />
                    </motion.div>
                    <Text className="text-cardd text-sm font-bbh font-bold">
                      Checking in...
                    </Text>
                  </>
                ) : (
                  <>
                    <RiFireFill className="text-cardd" size={20} />
                    <Text className="text-cardd text-sm font-bbh font-bold">
                      Check In
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Cards */}
      <View className="flex-row w-full items-center gap-3 flex-wrap">
        {/* Last Check-in Info */}
        {goal.lastCheckInDate && (
          <View className="rounded-2xl p-3 bg-cardd-700/40 flex-1 min-w-[140px]">
            <View className="flex-row items-center gap-2 mb-1">
              <Icon icon="mdi:calendar-check" className="text-white/50" style={{ fontSize: '14px' }} />
              <Text className="text-white/50 text-xs font-bbh">
                Last check-in
              </Text>
            </View>
            <Text className="text-white text-sm font-bbh font-semibold">
              {moment(new Date(goal.lastCheckInDate)).format('MMM d')}
            </Text>
          </View>
        )}

        {/* Reminder Time Info */}
        {goal.reminderTime && (
          <View className="rounded-2xl p-3 bg-cardd-700/40 flex-1 min-w-[140px]">
            <View className="flex-row items-center gap-2 mb-1">
              <Icon 
                icon={getEmojiIcon('⏰')} 
                className="text-white/50" 
                style={{ fontSize: '14px' }}
              />
              <Text className="text-white/50 text-xs font-bbh">
                Reminder
              </Text>
            </View>
            <Text className="text-white text-sm font-bbh font-semibold">
              {formatReminderTime(goal.reminderTime)}
            </Text>
          </View>
        )}

        {/* Edit Action */}
        {onEdit && (
          <Pressable
            onPress={handleEdit}
            className="rounded-2xl p-3 bg-cardd-700/40 hover:bg-cardd-700/50 flex-1 min-w-[140px] transition-colors border border-white/10"
          >
            <View className="flex-row items-center gap-2 mb-1">
              <RiEditLine className="text-white/50" size={14} />
              <Text className="text-white/50 text-xs font-bbh">
                Actions
              </Text>
            </View>
            <Text className="text-white text-sm font-bbh font-semibold">
              Edit Goal
            </Text>
          </Pressable>
        )}
      </View>

      <BottomNotch />
    </View>
  )
}
