import { useBottomSheetController } from '@/providers/bottom-sheet.provider'

export const useBottomSheet = () => {
  const { present, update, dismiss } = useBottomSheetController()
  return {
    present,
    update,
    dismiss,
  }
}
