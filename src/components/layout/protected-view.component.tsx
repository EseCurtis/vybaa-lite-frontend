import { useAuth } from '@/providers/auth.provider'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

type ProtectedViewComponentProps = {
  children: React.ReactNode
}

/**
 * Lightweight wrapper for protecting sections inside a screen.
 * Use `ProtectedRoute` for route-level protection.
 */
export const ProtectedViewComponent = ({ children }: ProtectedViewComponentProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white text-lg font-outfit">Loading...</Text>
      </View>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

