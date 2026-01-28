import { authAPI } from '@/shared/api/auth.api'
import type { OnboardingRequest } from '@/shared/types/auth.types'
import { useMutation } from '@tanstack/react-query'

export const useGetSuggestions = () => {
  return useMutation({
    mutationFn: (data: Omit<OnboardingRequest, 'selectedTasks'>) => 
      authAPI.getSuggestions(data),
  })
}
