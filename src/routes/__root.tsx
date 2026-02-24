import { TopNotch } from '@/components/common/notch.component'
import { AppLayout } from '@/components/layout/app/app-layout.component'
import ENV from '@/env'
import { BottomSheetProvider } from '@/providers/bottom-sheet.provider'
import { ModalProvider } from '@/providers/modal.provider'
import { TabBarProvider } from '@/providers/tab-bar.provider'
import { hapticFeedback } from '@/shared/haptic.util'
import { createRootRoute } from '@tanstack/react-router'
import { HomeIcon, Recycle } from 'lucide-react'

const isDev = ENV.ENVIRONMENT == 'development'
const showDevtools = isDev

export const Route = createRootRoute({
  component: () => {
    return (
      <TabBarProvider>
        <ModalProvider>
          <BottomSheetProvider>
            <>
              <AppLayout />

              {showDevtools && (
                <div className="fixed hidden bottom-0 right-[50%] opacity-5 z-[99999]  m-7 rounded-full">
                  
                
                  <TopNotch />
                  <div className="flex">
                    <div
                      onClick={async () => {
                        await hapticFeedback.light()
                        location.reload()
                      }}
                      className="bg-card-50/50 p-3 rounded-full"
                    >
                      <Recycle size={20} color="#fff" />
                    </div>

                    <div
                      onClick={async () => {
                        await hapticFeedback.light()
                        location.assign('/')
                      }}
                      className="bg-card-50/50 p-3 rounded-full"
                    >
                      <HomeIcon size={20} color="#fff" />
                    </div>
                  </div>
                </div>
              )}
            </>
          </BottomSheetProvider>
        </ModalProvider>
      </TabBarProvider>
    )
  },
})
