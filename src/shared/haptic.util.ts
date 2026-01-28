import { IS_MOBILE } from '@/shared/constants.shared'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export const hapticFeedback = {
  light: async () => {
    if (IS_MOBILE) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light })
      } catch (error) {
        console.log('Haptic feedback not available:', error)
      }
    }
  },
  
  medium: async () => {
    if (IS_MOBILE) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } catch (error) {
        console.log('Haptic feedback not available:', error)
      }
    }
  },
  
  heavy: async () => {
    if (IS_MOBILE) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy })
      } catch (error) {
        console.log('Haptic feedback not available:', error)
      }
    }
  },
  
  selection: async () => {
    if (IS_MOBILE) {
      try {
        await Haptics.selectionStart()
      } catch (error) {
        console.log('Haptic feedback not available:', error)
      }
    }
  }
}


