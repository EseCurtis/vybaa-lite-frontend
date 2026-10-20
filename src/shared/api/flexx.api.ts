import { http } from './http'
import {
  parseFlexxAnswer,
  parseFlexxAnswers,
} from '@/shared/flexx/flexx-answer'
import type {
  FlexxAnswer,
  FlexxAnswers,
  FlexxAnswerInput,
} from '@/shared/flexx/flexx-answer'
import { parseFlexxPage } from '@/shared/flexx/flexx-design'
import type {
  FlexxCategory,
  FlexxDesignPage,
} from '@/shared/flexx/flexx-design'

export const flexxAPI = {
  async answers(signal: AbortSignal): Promise<FlexxAnswers> {
    const response = await http.get<{ data: unknown }>(
      '/api/v1/flexx/questionnaire/answers',
      { signal },
    )
    return parseFlexxAnswers(response.data.data)
  },
  async saveAnswer(input: FlexxAnswerInput): Promise<FlexxAnswer> {
    const response = await http.post<{ data: unknown }>(
      '/api/v1/flexx/questionnaire/answers',
      input,
    )
    return parseFlexxAnswer(response.data.data)
  },
  async designs(
    category: FlexxCategory,
    cursor: string | null,
    signal: AbortSignal,
  ): Promise<FlexxDesignPage> {
    const response = await http.get<{ data: unknown }>(
      '/api/v1/flexx/designs',
      { params: { category, ...(cursor ? { cursor } : {}) }, signal },
    )
    return parseFlexxPage(response.data.data)
  },
}
