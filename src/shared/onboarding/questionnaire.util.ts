import type {
  OnboardingAnswer,
  OnboardingData,
} from '@/shared/api/onboarding.api'
import { parseOnboardingData } from './questionnaire-contract'

const SEEN_KEY = 'vybaa:questionnaire-seen:v1:'
const seenThisSession = new Set<string>()

export function hasSeenQuestionnaire(userId: string): boolean {
  if (seenThisSession.has(userId)) return true
  try {
    return localStorage.getItem(`${SEEN_KEY}${userId}`) === 'true'
  } catch {
    return false
  }
}

export function markQuestionnaireSeen(userId: string): void {
  seenThisSession.add(userId)
  try {
    localStorage.setItem(`${SEEN_KEY}${userId}`, 'true')
  } catch {
    /* Server completion remains authoritative. */
  }
}

export function readQuestionnaireDraft(
  userId: string,
  data: OnboardingData,
): { index: number; answers: OnboardingAnswer[] } {
  const initial = { index: -1, answers: data.profile?.answers ?? [] }
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(`vybaa:questionnaire-draft:${userId}`) ?? 'null',
    )
    if (
      !value ||
      typeof value !== 'object' ||
      !('revision' in value) ||
      value.revision !== (data.profile?.revision ?? 0) ||
      !('index' in value) ||
      typeof value.index !== 'number' ||
      !Number.isInteger(value.index) ||
      value.index < -1 ||
      value.index > data.questions.length ||
      !('answers' in value) ||
      !Array.isArray(value.answers)
    )
      return initial
    const parsed = parseOnboardingData({
      ...data,
      profile: {
        version: 1,
        revision: value.revision,
        skipped: false,
        answers: value.answers,
      },
    })
    const answers = parsed.profile?.answers ?? []
    return { index: value.index, answers }
  } catch {
    return initial
  }
}

export function saveQuestionnaireDraft(
  userId: string,
  revision: number,
  index: number,
  answers: OnboardingAnswer[],
): void {
  try {
    sessionStorage.setItem(
      `vybaa:questionnaire-draft:${userId}`,
      JSON.stringify({ revision, index, answers }),
    )
  } catch {
    /* The in-memory draft remains editable. */
  }
}

export function clearQuestionnaireDraft(userId: string): void {
  try {
    sessionStorage.removeItem(`vybaa:questionnaire-draft:${userId}`)
  } catch {
    /* Non-critical after the server saves. */
  }
}
