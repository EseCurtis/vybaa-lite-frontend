import { useBottomSheetController } from '@/providers/bottom-sheet.provider'

export const useBottomSheet = () => {
  const { present, update, dismiss, dismissAll } = useBottomSheetController()
  return {
    present,
    update,
    dismiss,
    dismissAll,
  }
}
