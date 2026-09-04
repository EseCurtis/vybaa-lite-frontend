import { http } from '@/shared/api/http'

export interface RealtimeTokenResponse {
  data: {
    token: string
    wsUrl: string
  }
  msg: string
}

class RealtimeAPI {
  public async createToken(): Promise<RealtimeTokenResponse> {
    const { data } = await http.post<RealtimeTokenResponse>(
      '/api/v2/realtime/token',
    )
    return data
  }
}

export const realtimeAPI = new RealtimeAPI()
