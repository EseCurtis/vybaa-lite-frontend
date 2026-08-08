import { BottomNotch } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { VirtualList } from '@/components/common/virtual-list.component'
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
import { getPushNotificationRoute } from '@/shared/notifications/in-app-notification.util'
import { navigateToDeepLinkTarget } from '@/shared/utils/auth-redirect.util'
import { normalizeDeepLink } from '@/shared/utils/deep-link.util'
import { Dimensions } from '@/shared/utils/dimensions.util'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import { useRouter } from '@tanstack/react-router'
import moment from 'moment'
import { useEffect, useState, type ReactElement } from 'react'

function mergeNotifications(
  currentNotifications: Notification[],
  nextNotifications: Notification[],
): Notification[] {
  const nextNotificationById = new Map(
    nextNotifications.map((notification) => [notification.id, notification]),
  )
  const mergedNotifications = currentNotifications.map(
    (notification) => nextNotificationById.get(notification.id) ?? notification,
  )
  const currentNotificationIds = new Set(
    currentNotifications.map((notification) => notification.id),
  )
  const appendedNotifications = nextNotifications.filter(
    (notification) => !currentNotificationIds.has(notification.id),
  )

  return [...mergedNotifications, ...appendedNotifications]
}

function getNotificationIconEmoji(notification: Notification): string {
  if (
    notification.type === 'system' &&
    notification.title?.includes('Streak Reset')
  ) {
    return '⚠️'
  }

  if (notification.type === 'goal_completed') {
    return '🎉'
  }

  if (notification.type === 'goal_reminder') {
    return '⏰'
  }

  if (notification.type === 'streak_milestone') {
    return '🔥'
  }

  if (notification.type === 'system') {
    return '📢'
  }

  return '🔔'
}

function formatNotificationDate(dateString: string): string {
  return moment(dateString).fromNow()
}

function NotificationItem({
  notification,
  onDelete,
  onOpen,
}: {
  notification: Notification
  onDelete: (id: string) => void
  onOpen: (notification: Notification) => void
}): ReactElement {
  return (
    <div
      className={`mb-3 cursor-pointer p-4 !active:opacity-50 ${
        !notification.isRead
          ? 'rounded-2xl bg-cardx'
          : 'border-b border-card-light/20'
      }`}
      onClick={() => onOpen(notification)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onOpen(notification)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <View className="flex flex-row items-start gap-3">
        <Icon
          icon={getEmojiIcon(getNotificationIconEmoji(notification))}
          className="text-white shrink-0"
          style={{ fontSize: '32px' }}
        />

        <View className="flex-1">
          <Text
            lines={1}
            className={`font-bbh text-sm mb-1 ${notification.isRead ? 'text-white font-semibold ' : 'text-white font-bold '}`}
          >
            {notification.title}
          </Text>
          <Text
            className={`text-xs mb-2 ${notification.isRead ? 'text-card-lighter-3/70' : 'text-card-lighter-3'}`}
            lines={2}
          >
            {notification.message}
          </Text>
        </View>

        <View className="justify-between h-full ">
          <View className="flex flex-row justify-end gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete(notification.id)
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Delete"
            >
              <Icons.Trash size="sm" color="#ef4444" />
            </button>
          </View>

          <Text className="text-xs ml-auto text-card-lighter-3 pt-3">
            {formatNotificationDate(notification.createdAt)}
          </Text>
        </View>
      </View>
    </div>
  )
}

export default function NotificationsScreen(): ReactElement {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { data, isLoading, isFetching } = useNotifications(page, 20)
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()

  const pagination = data?.pagination
  const hasUnread = notifications.some((n) => !n.isRead)
  const hasMore = pagination?.hasNextPage ?? false
  const isInitialLoading = isLoading && notifications.length === 0

  useEffect(() => {
    const nextNotifications = data?.data

    if (!nextNotifications) {
      return
    }

    setNotifications((currentNotifications) =>
      page === 1
        ? nextNotifications
        : mergeNotifications(currentNotifications, nextNotifications),
    )
  }, [data?.data, page])

  const handleMarkAsRead = (id: string): void => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    )
    markAsRead(id)
  }

  const handleMarkAllAsRead = (): void => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    )
    markAllAsRead()
  }

  const handleDeleteNotification = (id: string): void => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== id),
    )
    deleteNotification(id)
  }

  const handleOpenNotification = (notification: Notification): void => {
    handleMarkAsRead(notification.id)

    const route = getPushNotificationRoute({
      body: notification.message,
      data: notification.data ?? {},
      id: notification.id,
      title: notification.title,
    })
    if (!route) return

    const target = normalizeDeepLink(`https://vybaa.app${route}`)
    if (target) {
      void navigateToDeepLinkTarget(router, target)
    }
  }

  return (
    <View className="flex-1 bg-cardd">
      <TabHeader title="Notifications" className="z-[99]" />

      <View className="flex-1 w-full px-4 pt-3 max-w-4xl mx-auto">
        {isInitialLoading ? (
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
          <VirtualList
            items={notifications}
            height={
              Dimensions.screenHeight -
              Dimensions.tabBarHeight -
              Dimensions.bottomSafePadding
            }
            estimateSize={104}
            header={
              hasUnread ? (
                <View className="mb-6 w-full flex justify-end">
                  <Button
                    label="Mark all read"
                    variant="secondary"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    loading={isMarkingAll}
                    disabled={isMarkingAll}
                    fullWidth
                    style={{
                      width: '100%',
                    }}
                  />
                </View>
              ) : null
            }
            renderItem={(notification) => (
              <NotificationItem
                notification={notification}
                onDelete={handleDeleteNotification}
                onOpen={handleOpenNotification}
              />
            )}
            footer={
              hasMore ? (
                <View className="pb-10">
                  <View className="py-4 pb-10 flex-row items-center justify-center">
                    <Button
                      label={isFetching ? 'Loading...' : 'Load More'}
                      variant="default"
                      fullWidth
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={isFetching}
                      textClassName="text-sm"
                      size="sm"
                    />
                  </View>
                  <BottomNotch />
                </View>
              ) : (
                <View className="h-[120px]" />
              )
            }
          />
        )}
      </View>
    </View>
  )
}
