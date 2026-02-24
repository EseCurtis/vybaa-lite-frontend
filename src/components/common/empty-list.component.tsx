import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export interface EmptyListProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
}

export function EmptyList({ icon, title, description, action }: EmptyListProps) {
  return (
    <View className="flex-1 items-center justify-start  px-8 py-16 ">
      {icon && (
        <View className="mb-6 ">
          {icon}
        </View>
      )}
      
      <Text className="text-white text-2xl font-bold font-bbh text-center mb-3">
        {title}
      </Text>
      
      {description && (
        <Text className="text-white/60 text-base font-bbh text-center mb-8 max-w-sm">
          {description}
        </Text>
      )}
      
      {action && (
        <Button
          label={action.label}
          variant="default"
          onClick={action.onPress}
          className="px-8"
        />
      )}
    </View>
  )
}
