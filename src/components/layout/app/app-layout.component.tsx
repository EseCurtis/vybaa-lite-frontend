import { TabBar } from '@/components/layout/app/tab-bar.component';
import { Outlet, useLocation } from '@tanstack/react-router';

export function AppLayout() {
  const location = useLocation()
  
  // Only show tab bar on app routes
  const shouldShowTabBar = location.pathname.startsWith('/app/');
  const onATab = location.pathname.split("/").length <4;

  
  
  return (
    <>
      <Outlet />
      
      {shouldShowTabBar && onATab && <TabBar />}
    </>
  )
}


