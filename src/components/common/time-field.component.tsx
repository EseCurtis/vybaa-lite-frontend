import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

interface TimeFieldProps {
  className?: string
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}

export function TimeField({
  className,
  disabled,
  onChange,
  value,
}: TimeFieldProps) {
  const hasValue = !!value

  return (
    <View className="relative w-full overflow-hidden flex">
      <View
        className={cn(
          'w-full rounded-full px-4 py-3 flex-row items-center justify-center',
          disabled ? 'bg-card-light-50' : 'bg-card-light',
          className,
        )}
      >
        <Text
          className={`text-md text-center font-bbh ${hasValue ? 'text-white' : 'text-card-lighter-3'}`}
        >
          {hasValue ? value : '00:00'}
        </Text>
        <Text className="text-card-lighter-3 text-xs font-bbh"> </Text>
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
