import { EmptyList } from '@/components/common/empty-list.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { RewardsData } from '@/shared/api/rewards.api'
import { RiCoinsLine, RiTrophyLine } from '@remixicon/react'

interface PlayWalletPanelProps {
  rewards: RewardsData
}

export function PlayWalletPanel({ rewards }: PlayWalletPanelProps) {
  return (
    <>
      <View className="rounded-[30px] bg-cardx p-6 space-y-1">
        <View className="flex-row items-center gap-2">
          <RiCoinsLine size={24} className="text-accent-400" />
          <Text className="text-card-lighter-3/60 text-sm font-bbh">
            Balance
          </Text>
        </View>
        <Text className="text-white text-4xl font-bold font-bbh">
          {rewards.balance.toLocaleString()}<Text className="text-xs">pts</Text>
        </Text>
        <Text className="text-card-lighter-3 text-xs font-bbh">
          Play Points earned from completed goals
        </Text>
      </View>

      {rewards.pendingPoints > 0 ? (
        <View className="rounded-[30px] bg-cardx p-6 space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <RiTrophyLine size={20} className="text-accent-400" />
              <Text className="text-white/80 text-sm font-bbh">
                Pending Play Points
              </Text>
            </View>
            <Text className="text-accent-400 text-2xl font-bold font-bbh">
              {rewards.pendingPoints.toLocaleString()}
            </Text>
          </View>
          <Text className="text-white/50 text-xs font-bbh">
            These Play Points will be added to your balance when you complete
            your goals
          </Text>

          {rewards.pendingBreakdown.length ? (
            <View className="mt-4 space-y-2">
              <Text className="text-white/60 text-xs font-bbh mb-2">
                Pending from:
              </Text>
              {rewards.pendingBreakdown.map((item) => (
                <View
                  key={item.goalId}
                  className="rounded-xl bg-card-light/5 p-3 space-y-1"
                >
                  <Text className="text-white/80 text-sm font-bbh">
                    {item.goalText}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-bbh">
                      {item.community?.name ? `${item.community.name} • ` : ''}
                      Day {item.currentDay} / {item.targetDays}
                    </Text>
                    <Text className="text-accent-400 text-xs font-bbh">
                      +{item.pendingPoints} Play Points
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View className="rounded-[30px] bg-cardx  p-6">
          <EmptyList
            icon={<RiTrophyLine size={48} className="text-card-lighter-3" />}
            title="No pending Play Points"
            description="Complete goals with milestones to earn pending Play Points"
          />
        </View>
      )}
    </>
  )
}
