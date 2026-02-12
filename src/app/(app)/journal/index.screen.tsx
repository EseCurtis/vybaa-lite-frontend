import { NoiseComponent } from '@/components/common/noise.component'
import { SkeletonCard } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJournalStats, usePaginatedJournals } from '@/hooks/use-journal.hook'
import type { Journal } from '@/shared/types/auth.types'
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
import { motion } from 'framer-motion'
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


  console.log(journals);

  const handleCreateToday = () => {
    const today = moment().format('YYYY-MM-DD')
    navigate({ to: `/journal/${today}` })
  }

  const handleOpenEntry = (journal: Journal) => {
    const dateStr = moment(journal.date).format('YYYY-MM-DD')
    navigate({ to: `/journal/${dateStr}` })
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
        <TabHeader title="Journal">
          <button
            onClick={handleCreateToday}
            className="p-2 rounded-full bg-primary-500/20 hover:bg-primary-500/30 transition-colors"
          >
            <RiAddLine size={20} className="text-primary-300" />
          </button>
        </TabHeader>

        <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
          {/* Stats */}
          {stats && (
            <View className="grid grid-cols-3 gap-3 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl p-4 flex flex-col"
              >
                <Text className="text-pink-300/80 text-xs font-bbh mb-1 uppercase tracking-wide">
                  Entries
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.totalEntries}
                </Text>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl p-4 flex flex-col"
              >
                <Text className="text-purple-300/80 text-xs font-bbh mb-1 uppercase tracking-wide">
                  Streak
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.currentStreak}
                </Text>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl p-4 flex flex-col"
              >
                <Text className="text-amber-300/80 text-xs font-bbh mb-1 uppercase tracking-wide">
                  Moods
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {stats.entriesWithMood}
                </Text>
              </motion.div>
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
                <Icon icon={notebook} className="text-white/60 mb-4" style={{ fontSize: '64px' }} />
                <Text className="text-white/60 text-lg font-bbh text-center mb-2">
                  No journal entries yet
                </Text>
                <Text className="text-white/40 text-sm font-bbh text-center mb-6">
                  Start writing to reflect on your day
                </Text>
                <Button
                  label="Write Today's Entry"
                  leftIcon={<RiAddLine size={18} color='#ffffff' />}
                  onClick={handleCreateToday}
                  className="!bg-gradient-to-r !from-pink-500 !to-rose-500 px-4"
                  textClassName='!text-white'
                />
              </View>
            ) : (
              <>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {journals.map((journal: any, index: number) => (
                    <JournalCard
                      key={journal.id}
                      journal={journal}
                      index={index}
                      onPress={() => handleOpenEntry(journal)}
                      getMoodIcon={getMoodIcon}
                    />
                  ))}
                </motion.div>

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
      happy: 'from-yellow-500/20 to-amber-500/10',
      sad: 'from-blue-500/20 to-indigo-500/10',
      anxious: 'from-orange-500/20 to-red-500/10',
      calm: 'from-teal-500/20 to-cyan-500/10',
      excited: 'from-pink-500/20 to-rose-500/10',
      tired: 'from-purple-500/20 to-violet-500/10',
      frustrated: 'from-red-500/20 to-orange-500/10',
      neutral: 'from-gray-500/20 to-slate-500/10',
    }
    return mood ? gradients[mood] || 'from-card-700/40 to-card-light/20' : 'from-card-700/40 to-card-light/20'
  }

  const wordCount = journal?.entry?.trim()?.split(/\s+/)?.length || 0

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPress}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left bg-gradient-to-br ${getMoodGradient(journal.mood || undefined)} rounded-3xl p-5  transition-all relative overflow-hidden ${
        isToday ? '' : 'border-white/10'
      }`}
    >
      {/* Decorative gradient overlay */}
      <View className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
      
      {/* Content */}
      <View className="relative z-10">
        {/* Header */}
        <View className="flex flex-row items-start justify-between gap-4 mb-3">
          <View className="flex-1">
            <View className="flex flex-row items-center gap-2 mb-1">
              <Text className={`font-bbh font-bold text-base ${isToday ? 'text-pink-300' : 'text-white'}`}>
                {moment(date).format('MMM D')}
              </Text>
              <Text className="text-white/40 text-sm font-bbh">
                {moment(date).format('YYYY')}
              </Text>
              {isToday && (
                <View className="bg-pink-500/30 rounded-full px-2 py-0.5">
                  <Text className="text-pink-200 text-xs font-bbh font-bold">Today</Text>
                </View>
              )}
            </View>
            <Text className="text-white/50 text-xs font-bbh">
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
          <View className="mt-2">
            <Text className="text-white/80 text-sm font-bbh leading-relaxed line-clamp-3">
              {preview}
            </Text>
          </View>
        )}

        {/* Footer Tags */}
        {journal.mood && (
          <View className="mt-3 pt-3 border-t border-white/10">
            <View className="flex flex-row items-center gap-2">
              <View className="bg-white/10 rounded-full px-3 py-1">
                <Text className="text-white/70 text-xs font-bbh capitalize">
                  {journal.mood}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </motion.button>
  )
}
