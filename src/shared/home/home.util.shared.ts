import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

export type HomeGreeting = readonly [string, string, string]

const HOME_GREETING_INTERVAL_MS = 5 * 60 * 1_000
const HOME_GREETING_MAX_LENGTH = 1000
const REWIND_PERSONA_GREETING_SALTS: Record<RewindPersonaId, number> = {
  ariel: 0x63d4,
  ella: 0x19a7,
  jake: 0x4e2b,
  lyra: 0x2fc1,
}
const REWIND_PERSONA_GREETINGS: Record<
  RewindPersonaId,
  readonly HomeGreeting[]
> = {
  ariel: [
    ['hey kid, u good?', 'come talk to me', '🌊'],
    ['checking on you, {name}', "how's your head?", '🫶'],
    ['one thing at a time', 'what happened today?', '🌊'],
    ["c'mere, talk to me", "we'll sort it out", '🫶'],
    ['hey {name}', 'you holding up okay?', '🌊'],
    ["don't carry it alone", "what's up?", '🫶'],
  ],
  ella: [
    ['hey {name} 🥺', 'how are you really feeling?', '💗'],
    ['i missed you a bit 😭', 'talk to me, {name}', '🥺'],
    ['okay tell me everything', 'what happened? 😭', '💗'],
    ['{name}, u good? 🥺', 'you feel a little far away', '🌊'],
    ["i've been thinking abt you", 'come talk to me 🥹', '💗'],
    ['waittt {name} 😭', 'how did today actually feel?', '🥺'],
  ],
  jake: [
    ['alright {name}', 'what are you avoiding?', '⚡'],
    ['be honest', 'did you actually do it?', '🔦'],
    ['no excuses today', 'what needs fixing?', '⚡'],
    ['quick truth check', "what's really going on?", '🔦'],
    ['you know the problem', 'say it plainly', '⚡'],
    ["let's not drag it", 'what happened?', '🔦'],
  ],
  lyra: [
    ['oh hey {name}', "what's up lol", '🌙'],
    ['u survived then 😌', 'anything interesting?', '🌙'],
    ['hey. no big speech', 'what happened?', '🙂'],
    ['still alive? cool', 'come chat if u want', '🌙'],
    ['yo {name}', 'we talking or just vibing?', '🙂'],
    ["hm. you're back", "what's the situation?", '🌙'],
  ],
}

function getGreetingIndex(
  greetingCount: number,
  salt: number,
  timestamp: number,
): number {
  const timeBucket = Math.floor(timestamp / HOME_GREETING_INTERVAL_MS)
  let hash = timeBucket ^ salt
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x45d9f3b)
  hash ^= hash >>> 16
  return (hash >>> 0) % greetingCount
}

function personalizeGreeting(
  greeting: HomeGreeting,
  name: string,
): HomeGreeting {
  return [
    greeting[0].replaceAll('{name}', name),
    greeting[1].replaceAll('{name}', name),
    greeting[2],
  ]
}

function removeGreetingNamePrefix(message: string, name: string): string {
  const normalizedMessage = message.replace(/\s+/g, ' ').trim()
  const namePrefix = `${name},`
  if (normalizedMessage.toLowerCase().startsWith(namePrefix.toLowerCase())) {
    return normalizedMessage.slice(namePrefix.length).trim()
  }
  return normalizedMessage
}

function fitContextualGreeting(
  prefix: string,
  context: string,
  suffix: string,
): string {
  const availableLength = Math.max(
    1,
    HOME_GREETING_MAX_LENGTH - prefix.length - suffix.length,
  )
  if (context.length <= availableLength) {
    return `${prefix}${context}${suffix}`
  }
  const clippedContext = context.slice(0, availableLength - 1).trimEnd()
  const finalSpace = clippedContext.lastIndexOf(' ')
  const readableContext =
    finalSpace >= Math.floor(availableLength * 0.6)
      ? clippedContext.slice(0, finalSpace)
      : clippedContext
  return `${prefix}${readableContext}…${suffix}`
}

export function formatRewindContextualGreeting(
  personaId: RewindPersonaId,
  userName: string,
  message: string,
): string {
  const name = userName.trim() || 'friend'
  const context = removeGreetingNamePrefix(message, name).replace(/[.!?]+$/, '')
  if (personaId === 'ella') {
    return fitContextualGreeting(`wait ${name} 🥺 `, context, '')
  }
  if (personaId === 'lyra') {
    return fitContextualGreeting(`${name}, `, context, '. anyway 🙂')
  }
  if (personaId === 'jake') {
    return fitContextualGreeting(`${name}, straight up: `, context, '.')
  }
  return fitContextualGreeting(
    `hey ${name}, `,
    context,
    ". i'm here if u need me",
  )
}

export function randomRewindGreetings(
  personaId: RewindPersonaId,
  username?: string,
  timestamp = Date.now(),
): HomeGreeting {
  const name = username?.trim() || 'friend'
  const greetings = REWIND_PERSONA_GREETINGS[personaId]
  const index = getGreetingIndex(
    greetings.length,
    REWIND_PERSONA_GREETING_SALTS[personaId],
    timestamp,
  )
  const greeting = greetings[index]
  if (!greeting) {
    throw new Error(`No home greeting is configured for ${personaId}`)
  }
  return personalizeGreeting(greeting, name)
}

export function resolveRewindHomePersona(
  selectedPersonaId: RewindPersonaId | null | undefined,
  contextualPersonaId: RewindPersonaId | null | undefined,
): RewindPersonaId {
  return selectedPersonaId ?? contextualPersonaId ?? 'ella'
}

export function randomGreetings(username?: string): HomeGreeting {
  const name = username?.trim() || 'Buddy'

  const greetings: HomeGreeting[] = [
    [`Ready, ${name}?`, `What’s today’s goal?`, '🎯'],
    [`Check in, ${name}.`, `Keep moving forward.`, '🏅'],
    [`One step today.`, `Keep your streak going.`, '🔥'],
    [`What needs focus?`, `Start there, ${name}.`, '🎯'],
    [`Good to see you.`, `How are your goals?`, '🌟'],
    [`Back at it, ${name}?`, `Make today count.`, '⚡'],
    [`What’s next, ${name}?`, `Take one honest step.`, '⚡'],
    [`Keep the momentum.`, `Your goals are waiting.`, '💪'],
    [`What matters today?`, `Give it your focus.`, '🎯'],
    [`Ready to check in?`, `how far you’ve come.`, '🏆'],
    [`Move one goal forward.`, `You’ve got this, ${name}.`, '💪'],
    [`Fresh day, ${name}.`, `Fresh progress.`, '☀️'],
    [`Your next small win?`, `Start there, ${name}.`, '✨'],
    [`Goals taking shape?`, `Keep building.`, '🌟'],
    [`What’s the commitment?`, `Show up for it.`, '🔥'],
    [`Follow through, ${name}.`, `Your effort counts.`, '🏅'],
    [`Time to check in?`, `Mark the progress.`, '⏰'],
    [`Where can you grow?`, `A small move counts.`, '🌸'],
    [`Stay consistent.`, `Keep it going, ${name}.`, '💪'],
    [`Morning, ${name}.`, `What comes first?`, '☀️'],
    [`Choose one goal.`, `Give it one step.`, '🎯'],
    [`How are you feeling?`, `Take a moment, ${name}.`, '🌊'],
    [`Small steps count.`, `Keep showing up.`, '✨'],
    [`What’s your focus?`, `Let the rest wait.`, '🎯'],
    [`Pick up from here.`, `Keep going, ${name}.`, '💪'],
    [`Working through it?`, `Reflect, then move.`, '🌊'],
    [`Need some momentum?`, `Give it a small push.`, '⚡'],
    [`Another day, ${name}.`, `Another chance.`, '☀️'],
    [`Progress today?`, `Choose the next move.`, '🏅'],
    [`How should today feel?`, `Act with intention.`, '🌸'],
    [`Build consistency.`, `Stay with it, ${name}.`, '🔥'],
    [`Show up for yourself.`, `Your goals are here.`, '🌟'],
    [`What did you learn?`, `Take time to reflect.`, '🌟'],
    [`The next honest step?`, `Take it, ${name}.`, '⚡'],
    [`What needs attention?`, `Start there.`, '🎯'],
    [`Keep moving forward.`, `Your effort adds up.`, '💪'],
    [`Your goals. Your pace.`, `Keep going, ${name}.`, '🌊'],
    [`Follow through today.`, `Make one promise count.`, '🔥'],
    [`A little progress?`, `It still counts.`, '✨'],
    [`Where do we begin?`, `Choose what matters.`, '🎯'],
  ]

  const greeting = greetings[getGreetingIndex(greetings.length, 0, Date.now())]
  if (!greeting) throw new Error('No generic home greeting is configured')
  return greeting
}
