import { TabBar } from '@/components/layout/app/tab-bar.component'
import { AppWalkthrough } from '@/components/custom/onboarding/app-walkthrough.component'
import { useAuth } from '@/providers/auth.provider'
import { IS_WEB } from '@/shared/constants.shared'
import { Outlet, useLocation } from '@tanstack/react-router'
import { View } from '../view.component'

export function AppLayout() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const tabBarHideMatches = location.pathname.match(
    /\/app\/(home|goal|communities|journal|profile)(\/.*)?$/,
  )

  // Only show tab bar on app routes
  const shouldShowTabBar =
    !isLoading &&
    isAuthenticated &&
    location.pathname.startsWith('/app/') &&
    tabBarHideMatches
  const onATab = location.pathname.split('/').length < 4

  return (
    <>
      {IS_WEB ? (
        <View className="max-w-[400px] flex-1 mx-auto relative">
          <Outlet />
          {shouldShowTabBar && onATab && (
            <TabBar className="max-w-[400px] mx-auto  !left-1/2 !-translate-x-1/2" />
          )}
        </View>
      ) : (
        <>
          <Outlet />
          {shouldShowTabBar && onATab && <TabBar />}
        </>
      )}
      <AppWalkthrough />
    </>
  )
}
