import { http } from '@/shared/api/http'

export interface RewindQuestion {
  id: string
  text: string
  emoji: string
  options: string[]
}

export interface RewindQuestionnaireAnswer {
  questionId: string
  text: string
  custom: boolean
}

export interface RewindQuestionnaire {
  sessionId: string
  personaId: string
  sessionDateKey: string | null
  status:
    | 'COMPLETED'
    | 'FINALIZING'
    | 'IN_PROGRESS'
    | 'LEGACY'
    | 'MISSED'
    | 'SCHEDULED'
  questions: RewindQuestion[]
  answers: RewindQuestionnaireAnswer[]
}

export interface QuestionnaireCompletion {
  sessionId: string
  status:
    | 'already_completed'
    | 'completed'
    | 'finalizing'
    | 'missing'
    | 'missed'
    | 'needs_more_reflection'
  summary: string | null
}

const BASE_PATH = '/api/v1/rewind/questionnaire'

export const rewindQuestionnaireAPI = {
  async start(): Promise<RewindQuestionnaire> {
    const response = await http.post<{ data: RewindQuestionnaire }>(BASE_PATH)
    return response.data.data
  },
  async answer(
    sessionId: string,
    answer: RewindQuestionnaireAnswer,
  ): Promise<RewindQuestionnaire> {
    const response = await http.post<{ data: RewindQuestionnaire }>(
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/answers`,
      answer,
    )
    return response.data.data
  },
  async finish(sessionId: string): Promise<QuestionnaireCompletion> {
    const response = await http.post<{ data: QuestionnaireCompletion }>(
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/finish`,
    )
    return response.data.data
  },
}
