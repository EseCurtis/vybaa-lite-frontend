import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from '@/hooks/use-notifications.hook'
import type { Notification } from '@/shared/api/notification.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { seededColor } from '@/shared/utils/helpers.util'
import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useState } from 'react'

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const color = seededColor(notification.title)

  const getIconEmoji = () => {
    switch (notification.type) {
      case 'goal_completed':
        return '🎉'
      case 'goal_reminder':
        return '⏰'
      case 'streak_milestone':
        return '🔥'
      case 'system':
        // Check if it's a streak reset notification
        if (notification.title?.includes('Streak Reset')) {
          return '⚠️'
        }
        return '📢'
      default:
        return '🔔'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={` backdrop-blur-xl   p-4 mb-3 ${
        !notification.isRead ? 'bg-card-light/20 rounded-2xl' : 'border-b border-card-light'
      }`}
    >
      <View className="flex flex-row items-start gap-3">
        <Icon 
          icon={getEmojiIcon(getIconEmoji())} 
          className="text-white shrink-0" 
          style={{ fontSize: '32px' }}
        />
        
        <View className="flex-1">
          <Text
            className={`font-bbh font-bold mb-1 ${notification.isRead ? 'text-white/70' : 'text-white'}`}
          >
            {notification.title}
          </Text>
          <Text
            className={`text-sm mb-2 ${notification.isRead ? 'text-white/50' : 'text-white/80'}`}
          >
            {notification.message}
          </Text>
          <Text className="text-xs text-white/40">
            {formatDate(notification.createdAt)}
          </Text>
        </View>

        <View className="flex flex-row gap-2">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Mark as read"
            >
              <Icons.Check size="sm" color="#10b981" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Delete"
          >
            <Icons.Trash size="sm" color="#ef4444" />
          </button>
        </View>
      </View>
    </motion.div>
  )
}

export default function NotificationsScreen() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useNotifications(page, 20)
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()

  const notifications = data?.data || []
  const pagination = data?.pagination
  const hasUnread = notifications.some((n) => !n.isRead)

  const loading = isLoading || isFetching

  return (
    <View className="flex-1 bg-cardd">
      <TabHeader title="Notifications" />

      <View className="flex-1 px-4 pb-[120px] pt-3 max-w-4xl mx-auto overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex justify-end"
        >
          {hasUnread && (
            <Button
              label="Mark all read"
              variant="secondary"
              size="sm"
              onClick={() => markAllAsRead()}
              loading={isMarkingAll}
              disabled={isMarkingAll}
            />
          )}
        </motion.div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-white/60 text-lg font-bbh">
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Icon 
              icon={getEmojiIcon('🔔')} 
              className="text-white/60 mb-4" 
              style={{ fontSize: '64px' }}
            />
            <Text className="text-white/60 text-lg font-bbh text-center">
              No notifications yet
            </Text>
            <Text className="text-white/40 text-sm font-bbh text-center mt-2">
              You'll see updates about your goals here
            </Text>
          </View>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {[...notifications, ...notifications, ...notifications].map(
                (notification) => (
                  <Fragment key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </Fragment>
                ),
              )}
            </AnimatePresence>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <View className="flex flex-row items-center justify-center gap-4 mt-6">
                <Button
                  label="Previous"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                />
                <Text className="text-white/60 font-bbh">
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
                <Button
                  label="Next"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage || loading}
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}
