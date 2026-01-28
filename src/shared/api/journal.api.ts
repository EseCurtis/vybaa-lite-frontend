import { http } from '@/shared/api/http'
import type {
  CreateJournalRequest,
  JournalResponse,
  JournalsResponse,
  UpdateJournalRequest,
} from '@/shared/types/auth.types'

class JournalAPI {
  private base = '/api/v1/journals'

  async getJournals(): Promise<JournalsResponse> {
    const { data } = await http.get<JournalsResponse>(this.base)
    return data
  }

  async getJournalsPage(page = 1, limit = 10): Promise<JournalsResponse> {
    const { data } = await http.get<JournalsResponse>(`${this.base}?page=${Number(page)}&limit=${limit}`)
    return data
  }

  async createJournal(payload: CreateJournalRequest): Promise<JournalResponse> {
    const { data } = await http.post<JournalResponse>(this.base, payload)
    return data
  }

  async updateJournal(journalId: string, payload: UpdateJournalRequest): Promise<JournalResponse> {
    const { data } = await http.put<JournalResponse>(`${this.base}/${journalId}`, payload)
    return data
  }

  async deleteJournal(journalId: string): Promise<{ msg: string }> {
    const { data } = await http.delete<{ msg: string }>(`${this.base}/${journalId}`)
    return data
  }

  async getJournalById(journalId: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(`${this.base}/${journalId}`)
    return data
  }

  async getJournalByDate(date: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(`${this.base}/date/${date}`)
    return data
  }
}

export const journalAPI = new JournalAPI()


