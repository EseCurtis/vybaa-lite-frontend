import { http } from '@/shared/api/http'
import type { NotificationsResponse } from '@/shared/types/notification.types'

class NotificationAPI {
  private base = '/api/v1/notifications'

  async list(page = 1, limit = 10, seen?: boolean): Promise<NotificationsResponse> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (typeof seen === 'boolean') params.set('seen', String(seen))
    const { data } = await http.get(`${this.base}?${params.toString()}`)
    return data as NotificationsResponse
  }

  async markSeen(id: number): Promise<{ msg: string }> {
    const { data } = await http.patch(`${this.base}/${id}/seen`)
    return data
  }
}

export const notificationAPI = new NotificationAPI()







