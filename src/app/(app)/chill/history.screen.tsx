import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import {
  SkeletonCard,
  SkeletonStatsCard,
  SkeletonSummaryCard,
} from '@/components/common/skeleton.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useChillStats,
  useEmotionSummary,
  usePaginatedChillSessions,
} from '@/hooks/use-chill.hook'
import { useJournalStats, useJournalSummary } from '@/hooks/use-journal.hook'
import type { ChillSession } from '@/shared/api/chill.api'
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCloseLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import moment from 'moment'
import { useState } from 'react'

const SESSIONS_PER_PAGE = 10

export default function WellnessScreen() {
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  // Separate API calls
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
  } = useEmotionSummary()

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    isFetching: sessionsFetching,
  } = usePaginatedChillSessions(currentPage, SESSIONS_PER_PAGE)

  const { data: statsData, isLoading: statsLoading } = useChillStats()

  // Journal data
  const {
    data: journalSummaryData,
    isLoading: journalSummaryLoading,
    error: journalSummaryError,
  } = useJournalSummary()

  const { data: journalStatsData, isLoading: journalStatsLoading } =
    useJournalStats()

  const summary = summaryData?.summary || ''
  const summaryGenerated = summaryData?.summaryGenerated || false
  const sessions = sessionsData?.sessions || []
  const pagination = sessionsData?.pagination
  const stats = statsData || { totalSessions: 0, completedSessions: 0 }

  // Journal data extraction
  const journalSummary = journalSummaryData?.summary || ''
  const journalSummaryGenerated = journalSummaryData?.summaryGenerated || false
  const journalStats = journalStatsData || {
    totalEntries: 0,
    completedEntries: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
  }

  const handleNextPage = () => {
    if (pagination?.hasMore) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TopNotch />
        <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
          {/* Stats Cards */}
          <View className="grid grid-cols-2 gap-3 mb-6">
            {statsLoading ? (
              <>
                <SkeletonStatsCard />
                <SkeletonStatsCard />
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br flex flex-col from-cyan-500/20 to-teal-500/20 rounded-2xl p-4 "
                >
                  <Text className="text-cyan-300/80 text-xs font-bbh mb-1 uppercase tracking-wide">
                    Total Sessions
                  </Text>
                  <Text className="text-white text-3xl font-bbh font-bold">
                    {stats.totalSessions}
                  </Text>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl p-4  flex flex-col"
                >
                  <Text className="text-teal-300/80 text-xs font-bbh mb-1 uppercase tracking-wide">
                    Completed
                  </Text>
                  <Text className="text-white text-3xl font-bbh font-bold">
                    {stats.completedSessions}
                  </Text>
                </motion.div>
              </>
            )}
          </View>

          {/* AI Summary */}
          {summaryLoading ? (
            <SkeletonSummaryCard />
          ) : summaryError ? (
            <View className="bg-card-700/40 rounded-3xl p-6 mb-6 border border-white/10">
              <Text className="text-white/50 font-bbh text-center">
                Failed to load summary
              </Text>
            </View>
          ) : (
            summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className=" rounded-3xl p-6 px-05-mg pt-0 "
              >
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="text-cyan-300 text-lg font-bbh font-bold">
                    Your Emotional Journey
                  </Text>
                  {summaryGenerated && (
                    <Text className="text-cyan-300/50 text-xs font-bbh">
                      Updated just now
                    </Text>
                  )}
                </View>
                <Text className="text-white/80 text-base font-bbh leading-relaxed whitespace-pre-line">
                  {summary}
                </Text>
              </motion.div>
            )
          )}

          {/* Journal Summary */}
          {journalSummaryLoading ? (
            <SkeletonSummaryCard />
          ) : journalSummaryError ? (
            <View className="bg-card-700/40 rounded-3xl p-6 mb-6 border border-white/10">
              <Text className="text-white/50 font-bbh text-center">
                Failed to load journal summary
              </Text>
            </View>
          ) : (
            journalStats.totalEntries > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl p-6 mb-6 px-05-mg"
              >
                <View className="flex flex-row items-center justify-between mb-3">
                  <View className="">
                    <Text className="text-pink-300 text-lg font-bbh font-bold">
                      Your Journal Insights
                    </Text>
                    {journalSummaryGenerated && (
                      <Text className="text-pink-300/50 text-xs font-bbh">
                        Updated just now
                      </Text>
                    )}
                  </View>
                  <button
                    onClick={() => navigate({ to: '/app/journal' })}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <RiArrowRightLine size={18} className="text-pink-300/70" />
                  </button>
                </View>
                <Text className="text-white/80 text-base font-bbh leading-relaxed mb-3 whitespace-pre-line">
                  {journalSummary}
                </Text>
                <View className="flex flex-row gap-2">
                  <View className="bg-pink-500/20 rounded-xl px-3 py-1.5">
                    <Text className="text-pink-200/80 text-xs font-bbh">
                      {journalStats.totalEntries} entries
                    </Text>
                  </View>
                  <View className="bg-pink-500/20 rounded-xl px-3 py-1.5">
                    <Text className="text-pink-200/80 text-xs font-bbh">
                      {journalStats.currentStreak} day streak
                    </Text>
                  </View>
                </View>
              </motion.div>
            )
          )}

          {/* Sessions List */}
          <View className="space-y-3">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-white/70 text-lg font-bbh font-bold">
                All Sessions
                {pagination && ` (${pagination.total})`}
              </Text>
              {pagination && pagination.totalPages > 1 && (
                <Text className="text-white/50 text-sm font-bbh">
                  Page {currentPage} of {pagination.totalPages}
                </Text>
              )}
            </View>

            {sessionsLoading && !sessionsData ? (
              // Initial loading - show skeletons
              <View className="space-y-3">
                {[...Array(SESSIONS_PER_PAGE)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </View>
            ) : sessionsError ? (
              <View className="flex items-center justify-center py-12">
                <Text className="text-white/50 font-bbh text-center">
                  Failed to load sessions
                </Text>
              </View>
            ) : sessions.length === 0 ? (
              <View className="flex items-center justify-center py-12">
                <Text className="text-white/40 font-bbh text-center">
                  No sessions yet. Start your first chill session!
                </Text>
              </View>
            ) : (
              <>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {sessions.map((session, index) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      index={index}
                    />
                  ))}
                </motion.div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <View className="flex flex-row items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <Button
                      leftIcon={<RiArrowLeftSLine size={27} />}
                      onClick={handlePrevPage}
                      disabled={currentPage === 1 || sessionsFetching}
                      className="bg-white/5 hover:bg-white/10"
                    />
                    <Text className="text-white/60 text-sm font-bbh">
                      {pagination.page} / {pagination.totalPages}
                    </Text>
                    <Button
                      rightIcon={<RiArrowRightSLine size={27} />}
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore || sessionsFetching}
                      className="bg-white/5 hover:bg-white/10"
                      style={{
                        width: 'auto',
                      }}
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

function SessionCard({
  session,
  index,
}: {
  session: ChillSession
  index: number
}) {
  const date = new Date(session.createdAt)
  const completedDate = session.completedAt
    ? new Date(session.completedAt)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className=" rounded-2xl p-4 "
    >
      <View className="flex flex-row items-start justify-between gap-4">
        <View className="flex-1">
          {/* Date */}
          <Text className="text-white/50 text-xs font-bbh mb-2">
            {moment(date).format('MMM d, yyyy • h:mm a')}
          </Text>

          {/* Emotion */}
          <Text className="text-white/90 text-base font-bbh mb-2">
            "{session.emotion}"
          </Text>

          {/* Post-session mood */}
          {session.postSessionMood && (
            <View className="mt-2 pt-2 border-t border-white/10">
              <Text className="text-cyan-300/70 text-xs font-bbh mb-1">
                After session:
              </Text>
              <Text className="text-cyan-200/80 text-sm font-bbh">
                "{session.postSessionMood}"
              </Text>
            </View>
          )}

          {/* Duration */}
          {session.duration > 0 && (
            <Text className="text-white/40 text-xs font-bbh mt-2">
              {session.duration} minutes
            </Text>
          )}
        </View>

        {/* Status */}
        <View className="flex items-center justify-center">
          {session.completed ? (
            <View className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40">
              <RiCheckLine size={20} className="text-cyan-300" />
            </View>
          ) : (
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <RiCloseLine size={20} className="text-white/40" />
            </View>
          )}
        </View>
      </View>
      <View className=" mt-5">
        {' '}
        <hr className="border-card-light-50" />
      </View>
    </motion.div>
  )
}
