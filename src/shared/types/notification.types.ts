export type NotificationType = 'REMINDER' | 'INSIGHT' | 'TASK'

export interface Notification {
  id: number
  userId: string
  title: string
  type: NotificationType
  sentAt: string
  seen: boolean
}

export interface NotificationsResponse {
  msg: string
  data: {
    notifications: Notification[]
    meta: { total: number; page: number; pageSize: number; hasNext: boolean }
  }
}







