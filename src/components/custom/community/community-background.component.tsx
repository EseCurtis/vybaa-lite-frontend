import { View } from '@/components/layout/view.component'
import { seededColor } from '@/shared/utils/helpers.util'

interface CommunityBackgroundProps {
  communityName: string
}

export function CommunityBackground({ communityName }: CommunityBackgroundProps) {
  const seedColor = seededColor(communityName)

  return (
    <View
      style={{
        //@ts-ignore
        '--theme-color': seedColor,
      }}
      className="absolute top-0 left-0 bg-gradient-to-b opacity-5 from-[var(--theme-color)] to-transparent bg-blend-multiply size-full"
    />
  )
}
