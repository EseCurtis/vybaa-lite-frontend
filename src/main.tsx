import { installServerConsoleBridge } from '@/utils/server-console-bridge'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './providers/auth.provider.tsx'
import { NotificationProvider } from './providers/notification.provider.tsx'
import { SubscriptionProvider } from './providers/subscription.provider.tsx'
import { ToastProvider } from './providers/toast.provider.tsx'
import { shouldAnimate } from './shared/utils/animation.util.ts'
import { createAppQueryClient } from './shared/query-client.ts'
import { AppLoadingState } from './components/common/app-loading-state.component.tsx'
import {
  getAppNavigationTransition,
  getAppTabRoot,
} from './shared/utils/app-navigation.util.ts'

// Import the generated route tree
import { routeTree } from './routeTree.gen.ts'

import { CapacitorPlugin } from './plugins/capacitor/capacitor-plugin.tsx'
import reportWebVitals from './reportWebVitals.ts'

import './styles.css'

// In dev, mirror browser console.* calls to the server console
installServerConsoleBridge()

// Create a QueryClient instance
const queryClient = createAppQueryClient()

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  defaultPendingComponent: () => <AppLoadingState message="Opening page…" />,
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultViewTransition: shouldAnimate
    ? {
        types: ({ fromLocation, pathChanged, toLocation }) => {
          // The first render has no previous screen to animate from. Keeping
          // it out of the view-transition lifecycle avoids a flash on cold
          // launches and auth restoration.
          if (!pathChanged || !fromLocation) return false
          const fromPath = fromLocation.pathname.replace(/\/$/, '')
          const toPath = toLocation.pathname.replace(/\/$/, '')
          // Root tabs share persistent navigation. Snapshotting the document
          // freezes its pressed/selected state and puts screen images over it.
          if (
            getAppTabRoot(fromPath) === fromPath &&
            getAppTabRoot(toPath) === toPath
          ) {
            return false
          }
          return [
            getAppNavigationTransition(
              fromLocation?.pathname,
              toLocation.pathname,
            ),
          ]
        },
      }
    : false,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  const loadBody = () => {
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SubscriptionProvider>
              <ToastProvider>
                <NotificationProvider router={router}>
                  <CapacitorPlugin router={router} />
                  <RouterProvider router={router} />
                </NotificationProvider>
              </ToastProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </StrictMode>,
    )
  }

  loadBody()
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
