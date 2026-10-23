import { http } from './http'
import { parseOnboardingData } from '@/shared/onboarding/questionnaire-contract'
import type { OnboardingData } from '@/shared/onboarding/questionnaire-contract'
export { parseOnboardingData } from '@/shared/onboarding/questionnaire-contract'
export type {
  OnboardingAnswer,
  OnboardingData,
  OnboardingProfile,
  OnboardingQuestion,
} from '@/shared/onboarding/questionnaire-contract'

export const onboardingAPI = {
  async get(signal?: AbortSignal): Promise<OnboardingData> {
    const response = await http.get<{ data: unknown }>(
      '/api/v1/auth/onboarding',
      { signal },
    )
    return parseOnboardingData(response.data.data)
  },
}
