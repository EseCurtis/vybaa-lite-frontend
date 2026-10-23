export type OnboardingQuestion = {
  id: string
  section: string
  title: string
  hint: string
  maxChoices: number
  options: string[]
}
export type OnboardingAnswer = {
  questionId: string
  choices: string[]
  customText: string
}
export type OnboardingProfile = {
  version: 1
  revision: number
  skipped: boolean
  answers: OnboardingAnswer[]
}
export type OnboardingData = {
  questions: OnboardingQuestion[]
  profile: OnboardingProfile | null
  personalizationEnabled: boolean
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function strings(value: unknown, limit: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > limit)
    throw new Error('Invalid questionnaire choices')
  return value.map((entry: unknown) => {
    if (typeof entry !== 'string' || !entry.trim() || entry.length > maxLength)
      throw new Error('Invalid questionnaire text')
    return entry
  })
}

export function parseOnboardingData(value: unknown): OnboardingData {
  if (
    !record(value) ||
    !Array.isArray(value.questions) ||
    !value.questions.length ||
    value.questions.length > 20 ||
    typeof value.personalizationEnabled !== 'boolean'
  )
    throw new Error('Invalid questionnaire')
  const questions = value.questions.map(
    (entry: unknown): OnboardingQuestion => {
      if (
        !record(entry) ||
        typeof entry.id !== 'string' ||
        !entry.id ||
        typeof entry.section !== 'string' ||
        typeof entry.title !== 'string' ||
        !entry.title ||
        typeof entry.hint !== 'string' ||
        typeof entry.maxChoices !== 'number' ||
        !Number.isInteger(entry.maxChoices) ||
        entry.maxChoices < 1 ||
        entry.maxChoices > 3
      )
        throw new Error('Invalid questionnaire question')
      const options = strings(entry.options, 8, 100)
      if (options.length < 2 || new Set(options).size !== options.length)
        throw new Error('Invalid questionnaire options')
      return {
        id: entry.id,
        section: entry.section,
        title: entry.title,
        hint: entry.hint,
        maxChoices: entry.maxChoices,
        options,
      }
    },
  )
  if (
    new Set(questions.map((question) => question.id)).size !== questions.length
  )
    throw new Error('Duplicate questionnaire questions')
  let profile: OnboardingProfile | null = null
  if (value.profile !== null) {
    const saved = value.profile
    if (
      !record(saved) ||
      saved.version !== 1 ||
      typeof saved.revision !== 'number' ||
      !Number.isInteger(saved.revision) ||
      saved.revision < 0 ||
      typeof saved.skipped !== 'boolean' ||
      !Array.isArray(saved.answers) ||
      saved.answers.length > questions.length
    )
      throw new Error('Invalid saved questionnaire')
    const answers = saved.answers.map((entry: unknown): OnboardingAnswer => {
      if (
        !record(entry) ||
        typeof entry.questionId !== 'string' ||
        typeof entry.customText !== 'string' ||
        entry.customText.length > 500
      )
        throw new Error('Invalid saved answer')
      const question = questions.find((item) => item.id === entry.questionId)
      if (!question) throw new Error('Unknown saved question')
      const choices = strings(entry.choices, question.maxChoices, 100)
      if (
        choices.some((choice) => !question.options.includes(choice)) ||
        new Set(choices).size !== choices.length
      )
        throw new Error('Invalid saved choices')
      if (!choices.length && !entry.customText.trim())
        throw new Error('Empty saved answer')
      return {
        questionId: entry.questionId,
        choices,
        customText: entry.customText,
      }
    })
    if (
      new Set(answers.map((answer) => answer.questionId)).size !==
      answers.length
    )
      throw new Error('Duplicate saved answers')
    if (saved.skipped && answers.length)
      throw new Error('Invalid skipped questionnaire')
    profile = {
      version: 1,
      revision: saved.revision,
      skipped: saved.skipped,
      answers,
    }
  }
  return {
    questions,
    profile,
    personalizationEnabled: value.personalizationEnabled,
  }
}
