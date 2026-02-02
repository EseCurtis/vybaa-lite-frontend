import { TopNotch } from '@/components/common/notch.component'
import { AppLayout } from '@/components/layout/app/app-layout.component'
import { BottomSheetProvider } from '@/providers/bottom-sheet.provider'
import { ModalProvider } from '@/providers/modal.provider'
import { hapticFeedback } from '@/shared/haptic.util'
import { createRootRoute } from '@tanstack/react-router'
import { HomeIcon, Recycle } from 'lucide-react'


const showDevtools = false



export const Route = createRootRoute({
  component: () => {
    return (
      <ModalProvider>
        <BottomSheetProvider>
          <>
            <AppLayout />

              <div className="fixed top-0 right-0 opacity-100 z-[99999]  m-7 rounded-full">
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

        
          </>
        </BottomSheetProvider>
      </ModalProvider>
    )
  },
})
