import { http } from '@/shared/api/http'
import type {
  CreateJournalRequest,
  JournalResponse,
  JournalsResponse,
  UpdateJournalRequest,
} from '@/shared/types/auth.types'

class JournalAPI {
  private base = '/api/v1/journals'

  async getTodayEntry(): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(`${this.base}/today`)
    return data
  }

  async getJournalByDate(date: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(`${this.base}/date/${date}`)
    return data
  }

  async getJournalById(journalId: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(
      `${this.base}/${encodeURIComponent(journalId)}`,
    )
    return data
  }

  async getJournalsPage(pageParam, limit) {
     const { data } = await http.get<any>(`${this.base}/date`)
    return data
  }

  async getJournals(page: number = 1, limit: number = 20): Promise<JournalsResponse> {
    const { data } = await http.get<JournalsResponse>(this.base, {
      params: { page, limit },
    })
    return data
  }

  async createJournal(payload: CreateJournalRequest): Promise<JournalResponse> {
    const { data } = await http.post<JournalResponse>(this.base, payload)
    return data
  }

  async updateJournal(journalId: string, payload: UpdateJournalRequest): Promise<{ msg: string }> {
    const { data } = await http.put<{ msg: string }>(`${this.base}/${journalId}`, payload)
    return data
  }

  async deleteJournal(journalId: string): Promise<{ msg: string }> {
    const { data } = await http.delete<{ msg: string }>(`${this.base}/${journalId}`)
    return data
  }

  async getJournalSummary(): Promise<{
    msg: string
    data: {
      summary: string
      summaryGenerated: boolean
    }
  }> {
    const { data } = await http.get<{
      msg: string
      data: {
        summary: string
        summaryGenerated: boolean
      }
    }>(`${this.base}/summary`)
    return data
  }

  async getJournalStats(): Promise<{
    msg: string
    data: {
      totalEntries: number
      entriesWithMood: number
      currentStreak: number
    }
  }> {
    const { data } = await http.get<{
      msg: string
      data: {
        totalEntries: number
        entriesWithMood: number
        currentStreak: number
      }
    }>(`${this.base}/stats`)
    return data
  }
}

export const journalAPI = new JournalAPI()

