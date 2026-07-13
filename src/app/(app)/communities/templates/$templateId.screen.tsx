import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { TemplateParticipantCard } from '@/components/custom/community/template-participant-card.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useTemplate, useTemplateParticipants } from '@/hooks/use-communities.hook'
import { normalizePages } from '@/shared/utils/helpers.util'
import { RiFileList3Line, RiRefreshLine } from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export default function TemplateDetailScreen() {
  const router = useRouter()
  const { templateId } = useParams({ from: '/app/community/templates/$templateId' })
  const [page, setPage] = useState(1)

  const { data: template, isLoading: isLoadingTemplate } = useTemplate(templateId)
  const {
    data: participantsData,
    isLoading: isLoadingParticipants,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useTemplateParticipants(templateId, page, 20)

  const participants = normalizePages(participantsData?.pages || [])

  const handleRefresh = async () => {
    await refetch()
  }

  const handleBack = () => {
    if (template?.communityId) {
      router.navigate({
        params: { communityId: template.communityId },
        replace: true,
        to: '/app/community/$communityId',
      })
    } else {
      router.navigate({ replace: true, to: '/app/communities' })
    }
  }

  if (isLoadingTemplate) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Template Details" onBack={handleBack} />
          <View className="flex-1 items-center justify-center">
            <Spinner />
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (!template) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Template Details" onBack={handleBack} />
          <View className="flex-1 items-center justify-center px-mg">
            <EmptyList
              icon={<RiFileList3Line size={64} className="text-white/40" />}
              title="Template not found"
              description="This template may have been deleted or you don't have access to it."
            />
          </View>
        </NoiseComponent>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader
          canGoBack
          title={"Participants"}
          onBack={handleBack}
          children={
            <Pressable
              onPress={handleRefresh}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RiRefreshLine size={20} />
            </Pressable>
          }
        />

        <View className="px-mg py-4 space-y-3">
          <View className="p-4 rounded-2xl border border-dashed border-card-light/70 mb-2 justify-between">
            <Text className="text-white text-lg font-bold font-bbh mb-2">
              {template.goalText}
            </Text>
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-white/60 text-sm font-bbh">
                {template.targetDays} days
              </Text>
              <Text className="text-white/60 text-sm font-bbh">
                {template._count?.startedGoals || 0} participants
              </Text>
            </View>
          </View>

          {template.milestones && template.milestones.length > 0 && (
            <View className="p-3 rounded-2xl bg-card-light/10 border border-card-lighter-3/30 space-y-2">
              <Text className="text-white/80 text-sm font-bbh mb-1">
                Milestones
              </Text>
              {template.milestones
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((m) => (
                  <View
                    key={m.id}
                    className="flex-row items-center justify-between py-1.5"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-white/80 text-xs font-bbh">
                        {m.name}
                      </Text>
                      {m.description && (
                        <Text className="text-white/50 text-[11px] font-bbh">
                          {m.description}
                        </Text>
                      )}
                      <Text className="text-card-lighter-3/80 text-[11px] font-bbh mt-0.5">
                        {m.triggerType === 'DAY'
                          ? `Day ${m.triggerValue}`
                          : m.triggerType === 'PERCENTAGE'
                            ? `${m.triggerValue}% of goal`
                            : `Every ${m.triggerValue} days, from day ${m.sequenceStartDay ?? m.triggerValue} to day ${m.sequenceEndDay ?? template.targetDays}`}
                      </Text>
                    </View>
                    <Text className="text-accent-400 text-xs font-bbh">
                      +{m.points} pts
                      {m.triggerType === 'SEQUENCE'
                        ? `, +${m.sequenceBonusPoints} each repeat`
                        : ''}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        <View className="flex-1 px-mg pb-20">
          {isLoadingParticipants ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : participants.length === 0 ? (
            <EmptyList
              icon={<RiFileList3Line size={64} className="text-white/40" />}
              title="No participants yet"
              description="Be the first to start this goal!"
            />
          ) : (
            <VirtualList
              items={participants as any}
              estimateSize={140}
              height={520}
              renderItem={(participant) => (
                <TemplateParticipantCard
                  key={(participant as any).goalId}
                  participant={participant as any}
                  templateGoalText={template.goalText}
                />
              )}
              footer={
                <View className="mt-mg">
                  {hasNextPage && (
                    <Pressable
                      onPress={() => {
                        fetchNextPage()
                      }}
                      className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-4 font-bold"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Text className="whitespace-nowrap text-sm">
                            Loading
                          </Text>{' '}
                          <Spinner size={17} />
                        </>
                      ) : (
                        <Text className="whitespace-nowrap text-sm">
                          Load more
                        </Text>
                      )}
                    </Pressable>
                  )}

                  <BottomNotch />
                  <BottomNotch />
                  <BottomNotch />
                </View>
              }
            />
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
