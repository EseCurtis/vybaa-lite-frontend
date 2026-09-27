import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

interface SwitchProps {
  accessibilityLabel?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Switch({
  accessibilityLabel,
  checked,
  disabled = false,
  onChange,
  label,
  className = '',
}: SwitchProps) {
  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      {label && (
        <Text className="text-card-lighter-3 text-xs font-bbh">{label}</Text>
      )}
      <button
        type="button"
        aria-checked={checked}
        aria-label={accessibilityLabel ?? label}
        disabled={disabled}
        role="switch"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:brightness-75 ${checked ? 'bg-accent-500' : 'bg-card-light'}`}
      >
        <View
          className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-transform ${
            checked
              ? 'translate-x-[22px] bg-white'
              : 'translate-x-0.5 bg-card-lighter-3'
          }`}
        />
      </button>
    </View>
  )
}
