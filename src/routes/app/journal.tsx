import { View } from '@/components/layout/view.component'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/journal')({
  component: () => (
    <View className="flex-1">
      <Outlet />
    </View>
  ),
})
