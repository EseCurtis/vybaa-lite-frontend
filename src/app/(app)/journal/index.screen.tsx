import { NoiseComponent } from '@/components/common/noise.component'
import { SkeletonCard } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJournalStats, usePaginatedJournals } from '@/hooks/use-journal.hook'
import type { Journal } from '@/shared/types/auth.types'
import { adjustColor, seededColor } from '@/shared/utils/helpers.util'
import anxiousFaceWithSweat from '@iconify-icons/twemoji/anxious-face-with-sweat'
import beamingFaceWithSmilingEyes from '@iconify-icons/twemoji/beaming-face-with-smiling-eyes'
import cryingFace from '@iconify-icons/twemoji/crying-face'
import faceWithSteamFromNose from '@iconify-icons/twemoji/face-with-steam-from-nose'
import neutralFace from '@iconify-icons/twemoji/neutral-face'
import notebook from '@iconify-icons/twemoji/notebook'
import partyingFace from '@iconify-icons/twemoji/partying-face'
import relievedFace from '@iconify-icons/twemoji/relieved-face'
import sleepingFace from '@iconify-icons/twemoji/sleeping-face'
import { Icon } from '@iconify/react'
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import moment from 'moment'
import { useState } from 'react'

const JOURNALS_PER_PAGE = 20

export default function JournalListScreen() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: journalsData,
    isLoading,
    error,
    isFetching,
  } = usePaginatedJournals(currentPage, JOURNALS_PER_PAGE)

  const { data: stats } = useJournalStats()

  //@ts-ignore
  const journals = journalsData?.data || []
  //@ts-ignore
  const pagination = journalsData?.pagination

  console.log(journals)

  const handleCreateToday = () => {
    const today = moment().format('YYYY-MM-DD')
    navigate({ to: `/app/journal/${today}` })
  }

  const handleOpenEntry = (journal: Journal) => {
    navigate({
      to: '/app/journal-preview/$id',
      params: { id: journal.id },
    })
  }

  const getMoodIcon = (mood?: string) => {
    const moodMap: Record<string, any> = {
      happy: beamingFaceWithSmilingEyes,
      sad: cryingFace,
      anxious: anxiousFaceWithSweat,
      calm: relievedFace,
      excited: partyingFace,
      tired: sleepingFace,
      frustrated: faceWithSteamFromNose,
      neutral: neutralFace,
    }
    return mood ? moodMap[mood] || notebook : notebook
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader canGoBack={false} title="Journals">
          <button
            onClick={handleCreateToday}
            className="p-2 flex flex-row text-white bg-white  items-center gap-2 rounded-full"
          >
            <RiAddLine size={24} className="text-black" />
          </button>
        </TabHeader>

        <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
          {/* Stats */}
          {stats && (
            <View className="grid grid-cols-3 gap-1 mb-6">
              <View className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-4 flex flex-col">
                <Text className="text-pink-900/90 font-bold text-xs font-bbh mb-1  tracking-wide">
                  Entries
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.totalEntries}
                </Text>
              </View>

              <View className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg p-4 flex flex-col">
                <Text className="text-purple-900/90 font-bold text-xs font-bbh mb-1  tracking-wide">
                  Streak
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.currentStreak}
                </Text>
              </View>

              <View className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg p-4 flex flex-col">
                <Text className="text-amber-700/90 font-bold text-xs font-bbh mb-1  tracking-wide">
                  Moods
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.entriesWithMood}
                </Text>
              </View>
            </View>
          )}

          {/* Entries List */}
          <View className="space-y-3">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-white/70 text-lg font-bbh font-bold">
                Your Entries
                {pagination && ` (${pagination.total})`}
              </Text>
              {pagination && pagination.totalPages > 1 && (
                <Text className="text-white/50 text-sm font-bbh">
                  Page {currentPage} of {pagination.totalPages}
                </Text>
              )}
            </View>

            {isLoading && !journalsData ? (
              <View className="space-y-3">
                {[...Array(JOURNALS_PER_PAGE)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </View>
            ) : error ? (
              <View className="flex items-center justify-center py-12">
                <Text className="text-white/50 font-bbh text-center">
                  Failed to load journals
                </Text>
              </View>
            ) : journals.length === 0 ? (
              <View className="flex items-center justify-center py-12">
                <Icon
                  icon={notebook}
                  className="text-white/60 mb-4"
                  style={{ fontSize: '64px' }}
                />
                <Text className="text-white/60 text-lg font-bbh text-center mb-2">
                  No journal entries yet
                </Text>
                <Text className="text-white/40 text-sm font-bbh text-center mb-6">
                  Start writing to reflect on your day
                </Text>
                <Button
                  label="Write Today's Entry"
                  leftIcon={<RiAddLine size={18} color="#ffffff" />}
                  onClick={handleCreateToday}
                  className="!bg-gradient-to-r !from-pink-500 !to-rose-500 px-4"
                  textClassName="!text-white"
                />
              </View>
            ) : (
              <>
                <View key={currentPage} className="space-y-3">
                  {journals.map((journal: any, index: number) => (
                    <JournalCard
                      key={journal.id}
                      journal={journal}
                      index={index}
                      onPress={() => handleOpenEntry(journal)}
                      getMoodIcon={getMoodIcon}
                    />
                  ))}
                </View>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <View className="flex flex-row items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <Button
                      label="Previous"
                      leftIcon={<RiArrowLeftSLine size={18} />}
                      variant="secondary"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1 || isFetching}
                      className="bg-white/5 hover:bg-white/10"
                    />
                    <Text className="text-white/60 text-sm font-bbh">
                      {pagination.page} / {pagination.totalPages}
                    </Text>
                    <Button
                      label="Next"
                      rightIcon={<RiArrowRightSLine size={18} />}
                      variant="secondary"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!pagination.hasMore || isFetching}
                      className="bg-white/5 hover:bg-white/10"
                    />
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}

function JournalCard({
  journal,
  index,
  onPress,
  getMoodIcon,
}: {
  journal: Journal
  index: number
  onPress: () => void
  getMoodIcon: (mood?: string) => any
}) {
  const date = new Date(journal.date)
  const isToday = moment(date).isSame(moment(), 'day')
  const preview =
    journal?.entry?.length > 120
      ? journal?.entry?.substring(0, 120) + '...'
      : journal?.entry

  // Get mood color gradient
  const getMoodGradient = (mood?: string) => {
    const gradients: Record<string, string> = {
      happy: 'bg-yellow-500 to-amber-500',
      sad: 'from-blue-500 to-indigo-500',
      anxious: 'from-orange-500 to-red-500',
      calm: 'from-teal-500 to-cyan-500',
      excited: 'from-pink-500 to-rose-500',
      tired: 'from-purple-500 to-violet-500',
      frustrated: 'from-red-500 to-orange-500',
      neutral: 'from-gray-500 to-slate-500',
    }
    return mood
      ? gradients[mood] || 'from-card-700/40 to-card-light/20'
      : 'from-card-700/40 to-card-light/20'
  }

  const wordCount = journal?.entry?.trim()?.split(/\s+/)?.length || 0
  const color = seededColor((journal.mood + 'ld').replaceAll('e', '')!)
  const moodBg = adjustColor(color, {
    lightness: -40,
    saturation: -20,
    alpha: -0.85,
  })

  const textColor = adjustColor(color, {
    saturation: -20,
  })

  return (
    <button
      onClick={onPress}
      className={`w-full text-left  bg-cardx rounded-xl pt-5 px-0 relative overflow-hidden ${
        isToday ? '' : 'border-white/10'
      }`}
    >
      {/* Decorative gradient overlay */}
      <View className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />

      {/* Content */}
      <View className="relative z-10">
        {/* Header */}
        <View className="flex px-5 flex-row items-start justify-between gap-4 mb-3">
          <View className="flex-1">
            <View className="flex flex-row items-center gap-2 mb-1">
              {isToday ? (
                <View className="bg-red-500/30 rounded-full px-2 py-1">
                  <Text className="text-red-400 text-xs font-bbh font-bold">
                    Today
                  </Text>
                </View>
              ) : (
                <Text className={`font-bbh font-bold text-base text-white`}>
                  {moment(date).format('MMM D')}
                </Text>
              )}
              <Text className="text-card-lighter-3/40">•</Text>
              <Text className="text-card-lighter-3/40 text-sm font-bbh">
                {moment(date).format('YYYY')}
              </Text>
            </View>
            <Text className="text-card-lighter-3/70 text-xs font-bbh">
              {moment(date).format('dddd')} • {wordCount} words
            </Text>
          </View>

          {/* Mood Emoji Badge */}
          <View className="flex items-center justify-center">
            <View className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Icon
                icon={getMoodIcon(journal.mood || undefined)}
                className="text-white"
                style={{ fontSize: '28px' }}
              />
            </View>
          </View>
        </View>

        {/* Preview Text */}
        {preview && (
          <View className="mt-2 px-5">
            <Text className="text-white/80 text-sm font-bbh leading-relaxed line-clamp-3">
              {preview}
            </Text>
          </View>
        )}

        {/* Footer Tags */}
        {journal.mood && (
          <View className="mt-3 pt-3 px-3 pb-3 rounded-tl-[100px] bg-card-light/20 w-full">
            <View className="flex flex-row justify-end items-center gap-2">
              <View
                style={{
                  background: moodBg,
                  color: textColor,
                }}
                className="bg-card-lighter/30 rounded-full px-3 py-2"
              >
                <Text className=" font-bold text-xs  font-bbh ">
                  Feeling {journal.mood}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </button>
  )
}
