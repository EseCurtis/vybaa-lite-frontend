import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

interface TimeFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimeField({ value, onChange, disabled }: TimeFieldProps) {
  const hasValue = !!value

  return (
    <View className="relative w-full overflow-hidden flex">
      <View
        className={`w-full rounded-full px-4 py-3 flex-row items-center justify-center ${
          disabled ? 'bg-card-light/10' : 'bg-card-light/25'
        }`}
      >
        <Text
          className={`text-md text-center font-bbh ${
            hasValue ? 'text-white' : 'text-card-lighter-3/50'
          }`}
        >
          {hasValue ? value : 'Select time'}
        </Text>
        <Text className="text-card-lighter-3/70 text-xs font-bbh">
          
        </Text>
      </View>

      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      
        className="absolute top-0 left-0  w-screen opacity-0 h-full flex cursor-pointer"
      />
    </View>
  )
}

