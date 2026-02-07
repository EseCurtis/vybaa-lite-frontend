import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface Notification {
  id: string
  userId: string
  goalId?: string
  type: 'goal_reminder' | 'goal_completed' | 'streak_milestone' | 'system'
  title: string
  message: string
  data?: any
  isRead: boolean
  scheduledFor?: string
  sentAt?: string
  createdAt: string
}

export interface NotificationResponse {
  msg: string
  data: Notification[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface UnreadCountResponse {
  msg: string
  data: {
    count: number
  }
}

export interface AblyAuthResponse {
  msg: string
  data: any // Ably token request
}

class NotificationAPI {
  async getAblyAuth(): Promise<AblyAuthResponse> {
    const { data: res } = await http.get<AblyAuthResponse>(`${API_V1}/notifications/auth/ably`)
    return res
  }

  async getNotifications(page: number = 1, limit: number = 50): Promise<NotificationResponse> {
    const { data: res } = await http.get<NotificationResponse>(`${API_V1}/notifications`, {
      params: { page, limit },
    })
    return res
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const { data: res } = await http.get<UnreadCountResponse>(`${API_V1}/notifications/unread-count`)
    return res
  }

  async markAsRead(notificationId: string): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(
      `${API_V1}/notifications/${notificationId}/read`
    )
    return res
  }

  async markAllAsRead(): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(`${API_V1}/notifications/read-all`)
    return res
  }

  async deleteNotification(notificationId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/notifications/${notificationId}`
    )
    return res
  }
}

export const notificationAPI = new NotificationAPI()