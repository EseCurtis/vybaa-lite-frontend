import { http } from '@/shared/api/http'
import type {
  CreateJournalRequest,
  JournalResponse,
  Journal,
  UpdateJournalRequest,
} from '@/shared/types/auth.types'

export interface JournalPageResponse {
  msg: string
  data: Journal[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

class JournalAPI {
  private base = '/api/v1/journals'

  async getTodayEntry(): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(`${this.base}/today`)
    return data
  }

  async getJournalByDate(date: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(
      `${this.base}/date/${date}`,
    )
    return data
  }

  async getJournalById(journalId: string): Promise<JournalResponse> {
    const { data } = await http.get<JournalResponse>(
      `${this.base}/${encodeURIComponent(journalId)}`,
    )
    return data
  }

  async getJournalsPage(
    page: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<JournalPageResponse> {
    return this.getJournals(page, limit, signal)
  }

  async getJournals(
    page: number = 1,
    limit: number = 20,
    signal?: AbortSignal,
  ): Promise<JournalPageResponse> {
    const { data } = await http.get<JournalPageResponse>(this.base, {
      params: { page, limit },
      signal,
    })
    return data
  }

  async createJournal(payload: CreateJournalRequest): Promise<JournalResponse> {
    const { data } = await http.post<JournalResponse>(this.base, payload)
    return data
  }

  async updateJournal(
    journalId: string,
    payload: UpdateJournalRequest,
  ): Promise<{ msg: string }> {
    const { data } = await http.put<{ msg: string }>(
      `${this.base}/${journalId}`,
      payload,
    )
    return data
  }

  async deleteJournal(journalId: string): Promise<{ msg: string }> {
    const { data } = await http.delete<{ msg: string }>(
      `${this.base}/${journalId}`,
    )
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
