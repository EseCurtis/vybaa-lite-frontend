import { http } from '@/shared/api/http'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const API_V1 = '/api/v1'

export type RewindLiveTokenResponse = {
  msg: string
  data: {
    token: string
    wsUrl: string
    personaId: RewindPersonaId
    sessionId: string
  }
}

class RewindAPI {
  async createLiveToken(personaId: RewindPersonaId, sessionId?: string | null) {
    const { data: res } = await http.post<RewindLiveTokenResponse>(
      `${API_V1}/rewind/live-token`,
      { personaId, sessionId },
    )
    return res
  }
}

export const rewindAPI = new RewindAPI()
