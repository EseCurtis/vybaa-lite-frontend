import { TabBar } from '@/components/layout/app/tab-bar.component'
import { AppWalkthrough } from '@/components/custom/onboarding/app-walkthrough.component'
import { StartupHandoff } from '@/components/common/startup-handoff.component'
import { QueryFeedback } from '@/components/common/query-feedback.component'
import { useAuth } from '@/providers/auth.provider'
import { IS_WEB } from '@/shared/constants.shared'
import { Outlet, useLocation } from '@tanstack/react-router'
import { View } from '../view.component'

export function AppLayout() {
  const location = useLocation()
  const { isAuthenticated, stale, error, refreshSession } = useAuth()
  const tabBarHideMatches = location.pathname.match(
    /\/app\/(home|goal|communities|journal|profile)(\/.*)?$/,
  )

  // Only show tab bar on app routes
  const shouldShowTabBar =
    !stale &&
    isAuthenticated &&
    location.pathname.startsWith('/app/') &&
    tabBarHideMatches
  const onATab = /^\/app\/(home|goal|communities|journal|profile)\/?$/.test(
    location.pathname,
  )
  const routeContent = (
    <View className="app-route-content flex-1 min-h-0 min-w-0 relative">
      <Outlet />
    </View>
  )

  if (!stale && !isAuthenticated && error && localStorage.getItem('authToken') && localStorage.getItem('refreshToken')) {
    return <>
      <StartupHandoff />
      <View className="min-h-dvh items-center justify-center bg-cardd px-6">
        <div className="w-full max-w-sm">
          <p className="font-display text-xl font-bold text-white">Couldn't restore your session</p>
          <QueryFeedback message="Check your connection. Your account hasn't been signed out." onRetry={() => void refreshSession()} />
        </div>
      </View>
    </>
  }

  return (
    <>
      <StartupHandoff />
      {IS_WEB ? (
        <View className="max-w-[400px] flex-1 mx-auto relative">
          {routeContent}
          {shouldShowTabBar && onATab && (
            <TabBar className="max-w-[400px] mx-auto  !left-1/2 !-translate-x-1/2" />
          )}
        </View>
      ) : (
        <>
          {routeContent}
          {shouldShowTabBar && onATab && <TabBar />}
        </>
      )}
      <AppWalkthrough />
    </>
  )
}
