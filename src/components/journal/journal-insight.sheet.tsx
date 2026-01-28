import { useState } from 'react'
import { View } from '@/components/layout/view.component'
import { Text } from '@/components/layout/text.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Icons, Icon as LIcon } from '@/components/layout/icon.component'

export function JournalInsightSheet({ onClose }: { onClose?: () => void }) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-white font-bbh text-xl">Daily Check In</Text>
        <Text className="text-white/70 font-outfit text-sm">Write a few lines about your day. You can also record a quick voice note and we’ll transcribe it.</Text>
      </View>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was your day? Any wins, challenges, or feelings to note?"
          className="w-full bg-transparent outline-none text-white placeholder:text-white/40 min-h-[120px] resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <Text className="text-white/50 text-xs">{text.length}/1000</Text>
          <div className="flex items-center gap-2">
            <TouchableOpacity
              className={`px-3 py-2 rounded-full border ${isRecording ? 'border-red-500/50 bg-red-500/10' : 'border-[#2a2a2a] bg-[#141414]'}`}
              onPress={() => setIsRecording((v) => !v)}
            >
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <Icons.Pause size={16} className="text-red-400" />
                  <Text className="text-red-400 text-sm">Stop</Text>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LIcon name="Mic" size={16} className="text-white/80" />
                  <Text className="text-white/80 text-sm">Record</Text>
                </div>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="px-3 py-2 rounded-full border border-[#2a2a2a] bg-[#141414]">
              <div className="flex items-center gap-2">
                <Icons.Upload size={16} className="text-white/80" />
                <Text className="text-white/80 text-sm">Attach</Text>
              </div>
            </TouchableOpacity>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <TouchableOpacity
          className="flex-1 bg-card-600 hover:bg-card-500 rounded-xl py-3 text-center"
          onPress={onClose}
        >
          <Text className="text-white font-bbh">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-accent-600 hover:bg-accent-500 rounded-xl py-3 text-center"
          onPress={() => onClose?.()}
        >
          <Text className="text-white font-bbh">Save</Text>
        </TouchableOpacity>
      </div>
    </View>
  )
}


