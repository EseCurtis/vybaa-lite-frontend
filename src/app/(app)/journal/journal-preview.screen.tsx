import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { SkeletonCard } from '@/components/common/skeleton.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJournal } from '@/hooks/use-journal.hook'
import { RiBookOpenLine } from '@remixicon/react'
import moment from 'moment'
import type { ReactElement } from 'react'

export default function JournalPreviewScreen({
  journalId,
}: {
  journalId: string
}): ReactElement {
  const { data, isLoading, isError } = useJournal(journalId)
  const journal = data?.data?.journal

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Journal preview" />

        <View className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-3">
          {isLoading ? (
            <View className="mx-auto w-full max-w-2xl gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : isError || !journal ? (
            <View className="flex-1 items-center justify-center gap-3">
              <RiBookOpenLine size={42} className="text-card-lighter-3" />
              <Text className="text-center text-sm text-card-lighter-3">
                This journal entry is unavailable.
              </Text>
            </View>
          ) : (
            <View className="mx-auto w-full max-w-2xl gap-5">
              <View className="gap-2">
                <Text className="font-display text-3xl font-bold text-white">
                  {moment(journal.date).format('dddd, MMMM D')}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-card-lighter-3">
                    {moment(journal.date).format('YYYY')}
                  </Text>
                  {journal.mood ? (
                    <Text className="rounded-full bg-cardx px-3 py-1 text-xs capitalize text-card-lighter-2">
                      {journal.mood}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="rounded-2xl bg-cardx px-5 py-6">
                <Text className="whitespace-pre-line text-base leading-7 text-white/90">
                  {journal.entry}
                </Text>
              </View>

              {journal.aiSummary ? (
                <View className="gap-2 rounded-2xl bg-cardx px-5 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-card-lighter-3">
                    Reflection
                  </Text>
                  <Text className="whitespace-pre-line text-sm leading-6 text-card-lighter-2">
                    {journal.aiSummary}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
