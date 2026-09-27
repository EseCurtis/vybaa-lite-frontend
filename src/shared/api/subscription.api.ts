import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export const VYBAA_PRO_ENTITLEMENT_ID = 'vybaa_pro'

export type RewindInsightRange = '7d' | '30d' | '90d'

export interface SubscriptionLimits {
  activeGoals: number | null
  insightRanges: readonly RewindInsightRange[]
  ownedCommunities: number
  rewindSessionsPerDay: number
}

export interface SubscriptionUsage {
  activeGoals: number
  ownedCommunities: number
}

export interface SubscriptionConfig {
  entitlementId: string
  free: SubscriptionLimits
  offeringId: string
  pro: SubscriptionLimits
  products: {
    annual: string
    monthly: string
  }
}

export interface SubscriptionStatus {
  clientApp: 'vybaa'
  entitlementId: string
  environment: string | null
  expiresAt: string | null
  isConfigured: boolean
  isPro: boolean
  isTrial: boolean
  limits: SubscriptionLimits
  managementURL: string | null
  productIdentifier: string | null
  tier: 'free' | 'pro'
  usage: SubscriptionUsage
  verifiedAt: string
}

interface SubscriptionConfigResponse {
  data: SubscriptionConfig
  msg: string
}

interface SubscriptionStatusResponse {
  data: SubscriptionStatus
  msg: string
}

class SubscriptionAPI {
  public async getConfig(): Promise<SubscriptionConfig> {
    const { data } = await http.get<SubscriptionConfigResponse>(
      `${API_V1}/subscriptions/config`,
    )
    return data.data
  }

  public async getStatus(): Promise<SubscriptionStatus> {
    const { data } = await http.get<SubscriptionStatusResponse>(
      `${API_V1}/subscriptions/status`,
    )
    return data.data
  }

  public async sync(): Promise<SubscriptionStatus> {
    const { data } = await http.post<SubscriptionStatusResponse>(
      `${API_V1}/subscriptions/sync`,
    )
    return data.data
  }
}

export const subscriptionAPI = new SubscriptionAPI()
