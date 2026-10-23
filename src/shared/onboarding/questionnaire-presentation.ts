import type { PartnerEmotion } from '@/shared/rewind/partner-emojis'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

import type { OnboardingQuestion } from './questionnaire-contract'

type QuestionStyle = {
  accent: string
  surface: string
  partnerId: RewindPersonaId
  emotion: PartnerEmotion
  message: string
}

// Colour belongs to the illustration, never to the meaning of an answer.
const QUESTION_STYLES: Record<string, QuestionStyle> = {
  priorities: {
    accent: '#FF80AA',
    surface: '#321D30',
    partnerId: 'ella',
    emotion: 'love',
    message: 'Let’s make a little room for you.',
  },
  'day-shape': {
    accent: '#B6A3F5',
    surface: '#25213B',
    partnerId: 'lyra',
    emotion: 'listening',
    message: 'The usual day. Not the perfect one.',
  },
  energy: {
    accent: '#FCD34D',
    surface: '#332B1B',
    partnerId: 'jake',
    emotion: 'cheering',
    message: 'When does your battery wake up?',
  },
  planning: {
    accent: '#81CDBE',
    surface: '#19332F',
    partnerId: 'ariel',
    emotion: 'thinking',
    message: 'Your pace works here.',
  },
  starting: {
    accent: '#91B8FA',
    surface: '#1C2B42',
    partnerId: 'tobi',
    emotion: 'cheering',
    message: 'What gets you out of “later”?',
  },
  obstacles: {
    accent: '#DDA5B8',
    surface: '#34232D',
    partnerId: 'neeja',
    emotion: 'listening',
    message: 'No report cards here.',
  },
  stress: {
    accent: '#C3B6E6',
    surface: '#2C2639',
    partnerId: 'lyra',
    emotion: 'listening',
    message: 'Whatever you do, no judgement.',
  },
  recharge: {
    accent: '#B9D58C',
    surface: '#29321E',
    partnerId: 'ariel',
    emotion: 'love',
    message: 'What brings you back to yourself?',
  },
  change: {
    accent: '#D5AA90',
    surface: '#36291F',
    partnerId: 'neeja',
    emotion: 'thinking',
    message: 'Your first reaction counts too.',
  },
  support: {
    accent: '#FFB3CC',
    surface: '#3A2132',
    partnerId: 'ella',
    emotion: 'love',
    message: 'How should we show up for you?',
  },
  accountability: {
    accent: '#EFB46F',
    surface: '#392B1D',
    partnerId: 'jake',
    emotion: 'listening',
    message: 'A nudge, or a little space?',
  },
  reflection: {
    accent: '#8BD4DC',
    surface: '#1C333A',
    partnerId: 'tobi',
    emotion: 'thinking',
    message: 'There’s no right way to reflect.',
  },
  boundaries: {
    accent: '#D7CB98',
    surface: '#322F22',
    partnerId: 'ariel',
    emotion: 'listening',
    message: 'Only share what feels okay.',
  },
}

export function questionnairePresentation(
  question: OnboardingQuestion | undefined,
  reviewing: boolean,
): QuestionStyle {
  if (reviewing)
    return {
      accent: '#81CDBE',
      surface: '#19332F',
      partnerId: 'ariel',
      emotion: 'cheering',
      message: 'You get the final say.',
    }
  if (!question)
    return {
      accent: '#FF80AA',
      surface: '#321D30',
      partnerId: 'ella',
      emotion: 'love',
      message: 'Hey. Let’s get to know your kind of day.',
    }
  const style = Object.hasOwn(QUESTION_STYLES, question.id)
    ? QUESTION_STYLES[question.id]
    : undefined
  return (
    style ?? {
      accent: '#B6A3F5',
      surface: '#25213B',
      partnerId: 'lyra',
      emotion: 'listening',
      message: question.hint,
    }
  )
}

export function questionnaireDecoration(seed: string): {
  rotation: number
  offset: number
} {
  let hash = 0
  for (const character of seed)
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0
  return { rotation: (hash % 25) - 12, offset: hash % 13 }
}
