import type { OnboardingData } from '@/shared/api/onboarding.api'

export const questionnaireFixture: OnboardingData = {
  personalizationEnabled: true,
  profile: null,
  questions: [
    {
      id: 'support',
      section: 'In your corner',
      title: 'What support fits you?',
      hint: 'Choose up to two.',
      maxChoices: 2,
      options: ['Listening first', 'A little humour', 'Practical advice'],
    },
    {
      id: 'rhythm',
      section: 'Your rhythm',
      title: 'How does a day feel?',
      hint: 'Choose what fits.',
      maxChoices: 1,
      options: ['Predictable', 'Always changing'],
    },
  ],
}
