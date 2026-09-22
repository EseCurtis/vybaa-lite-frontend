import {
  RiChatSmile3Line,
  RiCheckLine,
  RiLock2Line,
  RiSparkling2Line,
  RiTeamLine,
} from '@remixicon/react'
import { useState, type ReactElement, type ReactNode } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useSubscription } from '@/providers/subscription.provider'

export type ProFeature = 'quick-goal-setup' | 'rewind-chats' | 'rewind-partners'

type ProFeatureCopy = {
  description: string
  eyebrow: string
  highlights: string[]
  title: string
}

const PRO_FEATURE_COPY: Record<ProFeature, ProFeatureCopy> = {
  'quick-goal-setup': {
    description:
      'Let your Rewind partner turn a rough idea into a complete goal you can review and edit.',
    eyebrow: 'Quick Goal Setup',
    highlights: [
      'Build a clear plan from a few words',
      'Ask your partner to adjust the draft',
      'Manual goal creation stays free',
    ],
    title: 'Plan goals faster with Pro',
  },
  'rewind-chats': {
    description:
      'Message your Rewind partners whenever something is on your mind—not only during a scheduled Rewind.',
    eyebrow: 'Anytime chats',
    highlights: [
      'Continue conversations between Rewinds',
      'Chat one-to-one or with the whole room',
      'Scheduled live Rewind stays free',
    ],
    title: 'Keep the conversation going',
  },
  'rewind-partners': {
    description:
      'Ella and Lyra are included for free. Pro unlocks every partner so you can choose the perspective you need.',
    eyebrow: 'All partners',
    highlights: [
      'Unlock Jake, Ariel, Tobi, and Neeja',
      'Keep Ella and Lyra on the free plan',
      'Switching still follows the daily limit',
    ],
    title: 'Meet the full Rewind team',
  },
}

const FEATURE_ICONS: Record<ProFeature, typeof RiLock2Line> = {
  'quick-goal-setup': RiSparkling2Line,
  'rewind-chats': RiChatSmile3Line,
  'rewind-partners': RiTeamLine,
}

function getProCtaLabel(isLoading: boolean, isSupported: boolean): string {
  if (isLoading) return 'Opening Pro…'
  if (!isSupported) return 'Available in the mobile app'
  return 'See Pro plans'
}

function ProFeatureCard({ feature }: { feature: ProFeature }): ReactElement {
  const copy = PRO_FEATURE_COPY[feature]
  const FeatureIcon = FEATURE_ICONS[feature]

  return (
    <View className="gap-5">
      <View className="size-14 items-center justify-center rounded-2xl bg-card-light">
        <FeatureIcon className="text-white" size={26} />
      </View>
      <View className="gap-2">
        <Text className="font-bbh text-xs font-bold uppercase tracking-[0.16em] text-card-lighter-3">
          {copy.eyebrow} · Vybaa Pro
        </Text>
        <Text className="font-display text-2xl font-extrabold leading-8 text-white">
          {copy.title}
        </Text>
        <Text className="font-bbh text-sm leading-6 text-card-lighter-2">
          {copy.description}
        </Text>
      </View>
      <View className="gap-3 rounded-2xl bg-cardx p-4">
        {copy.highlights.map((highlight) => (
          <View className="min-h-8 flex-row items-center gap-3" key={highlight}>
            <View className="size-7 shrink-0 items-center justify-center rounded-full bg-white">
              <RiCheckLine className="text-cardd" size={16} />
            </View>
            <Text className="min-w-0 flex-1 font-bbh text-sm leading-5 text-white">
              {highlight}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export function ProFeatureGateSheet({
  feature,
  onUnlocked,
}: {
  feature: ProFeature
  onUnlocked?: () => void
}): ReactElement {
  const bottomSheet = useBottomSheetController()
  const { requestProAccess } = useProAccess()
  const { isSupported } = useSubscription()
  const [isOpening, setIsOpening] = useState(false)

  async function handleUpgrade(): Promise<void> {
    if (isOpening) return
    setIsOpening(true)
    const granted = await requestProAccess()
    setIsOpening(false)
    if (!granted) return
    bottomSheet.dismiss()
    onUnlocked?.()
  }

  return (
    <View className="gap-5 pb-2">
      <ProFeatureCard feature={feature} />
      <View className="gap-2">
        <Pressable
          accessibilityLabel="See Vybaa Pro plans"
          className="min-h-12 items-center justify-center rounded-full bg-white px-5"
          disabled={isOpening}
          onPress={() => void handleUpgrade()}
        >
          <Text className="font-bbh text-sm font-bold text-cardd">
            {getProCtaLabel(isOpening, isSupported)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Not now"
          className="min-h-11 items-center justify-center rounded-full bg-cardx px-5"
          disabled={isOpening}
          onPress={bottomSheet.dismiss}
        >
          <Text className="font-bbh text-sm font-bold text-card-lighter-2">
            Not now
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export function RewindChatProGate({
  children,
}: {
  children: ReactNode
}): ReactElement {
  const { isLoading, isPro, isSupported } = useSubscription()
  const { requestProAccess } = useProAccess()

  if (isPro) return <>{children}</>

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Discussions" />
        <View className="flex-1 overflow-y-auto px-mg pb-[calc(var(--safe-area-inset-bottom,0px)+24px)] pt-6">
          <View className="mx-auto w-full max-w-xl gap-6 rounded-3xl bg-card-light-50 p-5">
            <ProFeatureCard feature="rewind-chats" />
            <Pressable
              accessibilityLabel="See Vybaa Pro plans"
              className="min-h-12 items-center justify-center rounded-full bg-white px-5"
              disabled={isLoading}
              onPress={() => void requestProAccess()}
            >
              <Text className="font-bbh text-sm font-bold text-cardd">
                {isLoading
                  ? 'Checking access…'
                  : getProCtaLabel(false, isSupported)}
              </Text>
            </Pressable>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
