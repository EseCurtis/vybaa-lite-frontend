import moment from 'moment'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { SkeletonCard } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJournal } from '@/hooks/use-journal.hook'
import { RiBookOpenLine } from '@remixicon/react'
import { MarkdownContent } from '@/shared/utils/markdown.util'

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
        <TabHeader
          title={
            moment(journal?.date).format(' MMMM D, YYYY') ||
            'Journal preview'
          }
        />

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
              <View className="gap-0">
                <Text className="font-display  text-3xl font-bold text-white">
                  {moment(journal.date).format('dddd')}
                </Text>
                <View className="flex-row items-center justify-end gap-2">
                  {journal.mood ? (
                    <Text className="rounded-full bg-cardx px-3 py-1 text-xs capitalize text-card-lighter-2">
                      {journal.mood}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="rounded-2xl  py-0">
                <MarkdownContent content={journal.entry.trim()} />
              </View>

              {journal.aiSummary ? (
                <View className="gap-2 rounded-2xl bg-cardx px-5 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-card-lighter-3">
                    Reflection
                  </Text>
                  <MarkdownContent content={journal.aiSummary} />
                </View>
              ) : null}
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
