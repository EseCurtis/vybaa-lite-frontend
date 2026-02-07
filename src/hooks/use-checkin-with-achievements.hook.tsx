import { AchievementModal } from '@/components/custom/achievement/achievement-modal.component'
import { useCheckIn } from '@/hooks/use-goals.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Achievement } from '@/shared/api/achievement.api'

/**
 * Enhanced check-in hook that automatically shows achievement popups
 */
export function useCheckInWithAchievements() {
  const checkInMutation = useCheckIn()
  const bottomSheet = useBottomSheetController()

  const checkIn = async (goalId?: string) => {
    try {
      const response = await checkInMutation.mutateAsync(goalId)

      // Check if any achievements were earned
      const achievements = (response as any)?.data?.achievements as Achievement[] | undefined

      if (achievements && achievements.length > 0) {
        // Show achievement bottom sheet for each earned badge (one at a time)
        for (const achievement of achievements) {
          await new Promise<void>((resolve) => {
            bottomSheet.present(
              <AchievementModal
                achievement={achievement}
                onDismiss={() => {
                  bottomSheet.dismiss()
                  resolve()
                }}
              />
            )
          })
        }
      }

      return response
    } catch (error) {
      throw error
    }
  }

  return {
    checkIn,
    isCheckingIn: checkInMutation.isPending,
  }
}
