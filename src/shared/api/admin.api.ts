import { http } from './http'

const API_V1 = '/api/v1'

export interface FeatureFlag {
  id: string
  key: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const adminAPI = {
  async listFeatureFlags(adminSecret: string): Promise<{ data: FeatureFlag[] }> {
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
}

