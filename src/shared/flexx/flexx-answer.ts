export type FlexxAnswer = {
  designId: string
  answer: string
  custom: boolean
  contributesToReflection: boolean
}
export type FlexxAnswers = {
  localDateKey: string
  personalizationEnabled: boolean
  answers: FlexxAnswer[]
}
export type FlexxAnswerInput = {
  designId: string
  localDateKey: string
  answer: string
  custom: boolean
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function parseFlexxAnswer(value: unknown): FlexxAnswer {
  if (
    !record(value) ||
    typeof value.designId !== 'string' ||
    value.designId.length > 160 ||
    typeof value.answer !== 'string' ||
    !value.answer ||
    value.answer.length > 800 ||
    typeof value.custom !== 'boolean' ||
    typeof value.contributesToReflection !== 'boolean'
  )
    throw new Error('Invalid saved Flexx answer')
  return {
    designId: value.designId,
    answer: value.answer,
    custom: value.custom,
    contributesToReflection: value.contributesToReflection,
  }
}
export function parseFlexxAnswers(value: unknown): FlexxAnswers {
  if (
    !record(value) ||
    typeof value.localDateKey !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.localDateKey) ||
    typeof value.personalizationEnabled !== 'boolean' ||
    !Array.isArray(value.answers) ||
    value.answers.length > 300
  )
    throw new Error('Invalid Flexx answer history')
  return {
    localDateKey: value.localDateKey,
    personalizationEnabled: value.personalizationEnabled,
    answers: value.answers.map(parseFlexxAnswer),
  }
}
