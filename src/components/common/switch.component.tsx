import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  className = '',
}: SwitchProps) {
  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      {label && (
        <Text className="text-card-lighter-3/80 text-xs font-bbh">{label}</Text>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10  h-5 rounded-full border transition-colors ${
          checked
            ? 'bg-accent-500 border-accent-500'
            : 'bg-card-light/30 border-card-lighter-3/60'
        }`}
      >
        <View
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </View>
  )
}
