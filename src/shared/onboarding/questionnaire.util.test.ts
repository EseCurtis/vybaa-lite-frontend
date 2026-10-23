// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest'
import { parseOnboardingData } from '@/shared/api/onboarding.api'
import { questionnaireFixture } from './questionnaire.test-fixture'
import {
  clearQuestionnaireDraft,
  hasSeenQuestionnaire,
  markQuestionnaireSeen,
  readQuestionnaireDraft,
  saveQuestionnaireDraft,
} from './questionnaire.util'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

it('keeps seen and draft state account-scoped and revision-aware', () => {
  markQuestionnaireSeen('owner')
  expect(hasSeenQuestionnaire('owner')).toBe(true)
  expect(hasSeenQuestionnaire('other')).toBe(false)
  const answers = [
    { questionId: 'support', choices: ['Listening first'], customText: '' },
  ]
  saveQuestionnaireDraft('owner', 0, 1, answers)
  expect(readQuestionnaireDraft('owner', questionnaireFixture)).toEqual({
    index: 1,
    answers,
  })
  expect(readQuestionnaireDraft('other', questionnaireFixture).answers).toEqual(
    [],
  )
  expect(
    readQuestionnaireDraft('owner', {
      ...questionnaireFixture,
      profile: { version: 1, revision: 1, skipped: false, answers: [] },
    }).answers,
  ).toEqual([])
  clearQuestionnaireDraft('owner')
  expect(readQuestionnaireDraft('owner', questionnaireFixture).index).toBe(-1)
})

it('rejects corrupt stored data and invalid server question contracts', () => {
  sessionStorage.setItem('vybaa:questionnaire-draft:owner', '{bad')
  expect(readQuestionnaireDraft('owner', questionnaireFixture).answers).toEqual(
    [],
  )
  saveQuestionnaireDraft('owner', 0, 999, [])
  expect(readQuestionnaireDraft('owner', questionnaireFixture).index).toBe(-1)
  expect(parseOnboardingData(questionnaireFixture)).toEqual(
    questionnaireFixture,
  )
  expect(() =>
    parseOnboardingData({
      ...questionnaireFixture,
      questions: [
        ...questionnaireFixture.questions,
        questionnaireFixture.questions[0],
      ],
    }),
  ).toThrow()
  expect(() =>
    parseOnboardingData({
      ...questionnaireFixture,
      profile: {
        version: 1,
        revision: 1,
        skipped: false,
        answers: [
          { questionId: 'unknown', choices: ['Invented'], customText: '' },
        ],
      },
    }),
  ).toThrow()
})
