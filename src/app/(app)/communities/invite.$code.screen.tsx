import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { JoinByCodeSheet } from '@/components/custom/community/join-by-code-sheet.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJoinByInviteCode } from '@/hooks/use-communities.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useParams, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export default function InviteCodeScreen() {
  const router = useRouter()
  const { code } = useParams({ from: '/app/invite/$code' })
  const bottomSheet = useBottomSheetController()
  const { mutateAsync: joinCommunity } = useJoinByInviteCode()

  useEffect(() => {
    // Auto-open the join sheet with the code pre-filled
    bottomSheet.present(
      <JoinByCodeSheet
        initialCode={code}
        onSuccess={(communityId) => {
          bottomSheet.dismiss()
          router.navigate({ to: `/app/community/${communityId}` })
        }}
        onClose={() => {
          bottomSheet.dismiss()
          router.navigate({ to: '/app/communities' })
        }}
      />,
      {
        title: 'Join Community',
        elevation: 9999,
      },
    )
  }, [code, bottomSheet, router, joinCommunity])

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader
          canGoBack
          title="Join Community"
          onBack={() => router.navigate({ to: '/app/communities' })}
        />
        <View className="gap-4 px-mg py-5">
          <Skeleton className="h-44 w-full" rounded="xl" />
          <Skeleton className="h-12 w-full" rounded="lg" />
        </View>
      </NoiseComponent>
    </View>
  )
}
