import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { AttachmentPicker, type Attachment } from './attachment-picker.component'
import { useState } from 'react'

interface CheckInSheetProps {
  goalText: string
  onCheckIn: (notes?: string, attachments?: Attachment[]) => Promise<void>
  onCancel: () => void
  isCheckingIn?: boolean
}

export function CheckInSheet({
  goalText,
  onCheckIn,
  onCancel,
  isCheckingIn = false,
}: CheckInSheetProps) {
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const handleSubmit = async () => {
    if (isCheckingIn) return // Prevent double submission
    
    const notesToSend = notes.trim() || undefined
    const attachmentsToSend = attachments.length > 0 ? attachments : undefined
    
    console.log('Submitting check-in:', { notes: notesToSend, attachments: attachmentsToSend })
    
    try {
      await onCheckIn(notesToSend, attachmentsToSend)
    } catch (error) {
      // Error is handled by the parent/API
      console.error('Check-in error:', error)
    }
  }

  return (
    <View className="space-y-6 pb-4">
      <View className="space-y-2">
        <Text className="text-white text-lg font-bbh font-bold">
          Check In
        </Text>
        <Text className="text-white/70 text-sm font-bbh">
          {goalText}
        </Text>
      </View>

      <View className="space-y-2">
        <Text className="text-white/80 text-sm font-bbh font-semibold">
          Notes (Optional)
        </Text>
        <View className="bg-card-light/40 rounded-xl p-3 border border-white/10">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go? What did you learn? (optional)"
            className="min-h-[100px] w-full text-white placeholder:text-white/40"
            maxLength={500}
          />
        </View>
        <Text className="text-white/40 text-xs font-bbh text-right">
          {notes.length}/500
        </Text>
      </View>

      <View className="space-y-2">
        <Text className="text-white/80 text-sm font-bbh font-semibold">
          Attachments (Optional)
        </Text>
        <AttachmentPicker
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          maxAttachments={5}
        />
      </View>

      <View className="flex-row gap-3 pt-2">
        <Button
          label="Cancel"
          variant="outline"
          onClick={onCancel}
          disabled={isCheckingIn}
          className="flex-1"
        />
        <Button
          label="Check In"
          variant="default"
          onClick={handleSubmit}
          disabled={isCheckingIn}
          loading={isCheckingIn}
          className="flex-1"
        />
      </View>
    </View>
  )
}
