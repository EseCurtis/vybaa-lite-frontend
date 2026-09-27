import { http } from './http'

const API_V1 = '/api/v1'

export interface FeatureFlag {
  id: string
  key: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type ModerationReportStatus =
  | 'DISMISSED'
  | 'OPEN'
  | 'RESOLVED'
  | 'REVIEWING'

export interface ModerationReport {
  createdAt: string
  details: string | null
  evidenceSnapshot: string | null
  id: string
  isOverdue: boolean
  reason: string
  responseDueAt: string
  status: ModerationReportStatus
  targetUser: {
    firstName: string | null
    id: string
    username: string | null
  }
}

export const adminAPI = {
  async listModerationReports(
    adminSecret: string,
    status: 'OPEN' | 'REVIEWING',
  ): Promise<{ data: ModerationReport[] }> {
    const { data } = await http.get<{
      data: ModerationReport[]
      msg: string
    }>(`${API_V1}/admin/moderation/reports`, {
      headers: { 'x-admin-secret': adminSecret },
      params: { status },
    })
    return { data: data.data }
  },

  async listFeatureFlags(
    adminSecret: string,
  ): Promise<{ data: FeatureFlag[] }> {
    const { data } = await http.get<{ msg: string; data: FeatureFlag[] }>(
      `${API_V1}/admin/feature-flags`,
      {
        headers: {
          'x-admin-secret': adminSecret,
        },
      },
    )
    return { data: data.data }
  },

  async upsertFeatureFlag(
    adminSecret: string,
    payload: { key: string; enabled: boolean },
  ): Promise<{ data: FeatureFlag }> {
    const { data } = await http.post<{ msg: string; data: FeatureFlag }>(
      `${API_V1}/admin/feature-flags`,
      payload,
      {
        headers: {
          'x-admin-secret': adminSecret,
        },
      },
    )
    return { data: data.data }
  },

  async updateModerationReport(
    adminSecret: string,
    reportId: string,
    payload: {
      action?: 'REMOVE_CONTENT_AND_SUSPEND'
      note?: string
      status: Exclude<ModerationReportStatus, 'OPEN'>
    },
  ): Promise<{ data: ModerationReport }> {
    const { data } = await http.patch<{
      data: ModerationReport
      msg: string
    }>(
      `${API_V1}/admin/moderation/reports/${encodeURIComponent(reportId)}`,
      payload,
      {
        headers: { 'x-admin-secret': adminSecret },
      },
    )
    return { data: data.data }
  },
}
