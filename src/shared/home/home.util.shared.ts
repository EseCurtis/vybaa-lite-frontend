export type HomeGreeting = readonly [string, string, string]

const HOME_GREETING_INTERVAL_MS = 5 * 60 * 1_000

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

  const timeBucket = Math.floor(Date.now() / HOME_GREETING_INTERVAL_MS)

  let hash = timeBucket
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x45d9f3b)
  hash ^= hash >>> 16

  return greetings[(hash >>> 0) % greetings.length]
}
