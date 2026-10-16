import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

type PartnerScheduleCopy = {
  future: Array<(time: string, remaining: string) => string>
  open: string
  setup: string
  complete: string
  waiting: string
}

const PARTNER_COPY: Record<RewindPersonaId, PartnerScheduleCopy> = {
  ella: {
    future: [
      (time, remaining) =>
        `Hope you're ready for our Rewind ${time}. It's in ${remaining}, a little space just for you 💛`,
      (time, remaining) =>
        `Saving you a little breathing room ${time}. We've got ${remaining} until our Rewind 🫶`,
      (time, remaining) =>
        `Our little check-in is ${time}, in ${remaining}. Bring whatever kind of day you're having 💭`,
    ],
    open: "It's our Rewind time. How are you, really? I'm here 💛",
    setup: "Let's make a little room for you. When should we check in? 🫶",
    complete: "You made some space for yourself. I'm glad you did 💛",
    waiting: 'Your next little pause is on its way. No need to rush 💭',
  },
  lyra: {
    future: [
      (time, remaining) =>
        `Rewind ${time}. That's in ${remaining}. No grand speech needed 🌙`,
      (time, remaining) =>
        `We've got ${remaining} until our Rewind ${time}. Go live a little first 😌`,
      (time, remaining) =>
        `A quiet check-in ${time}. ${remaining} to go. We'll keep it simple 🌙`,
    ],
    open: "We're up. A few questions, zero performance. Ready? 🌙",
    setup: 'Pick a time. We can keep this whole reflection thing low-key 🌙',
    complete: 'Done for now. You can put the day down 😌',
    waiting: "A little downtime until our next Rewind. You're good 🌙",
  },
  jake: {
    future: [
      (time, remaining) =>
        `Rewind ${time}. ${remaining} to go. Show up for yourself 🎯`,
      (time, remaining) =>
        `Heads up. Our check-in is ${time}, in ${remaining}. Keep it honest 🎯`,
      (time, remaining) =>
        `${remaining} until our Rewind ${time}. A few straight questions. You've got this 👊`,
    ],
    open: "It's time. A few honest answers will do more than overthinking it 🎯",
    setup: 'Give your Rewind a time. Make showing up easier 🎯',
    complete:
      'You showed up. Take what was useful into the rest of your day 👊',
    waiting: "We'll pick this up at the next Rewind. One thing at a time 🎯",
  },
  ariel: {
    future: [
      (time, remaining) =>
        `Little heads-up: our Rewind is ${time}, in ${remaining}. Leave yourself a minute, okay? 🤍`,
      (time, remaining) =>
        `We've got a check-in ${time}. ${remaining} to go — you don't need to have it all figured out 🫶`,
      (time, remaining) =>
        `A moment for you ${time}, in ${remaining}. Save a little energy for yourself too 🤍`,
    ],
    open: "Our Rewind is ready. Let's give you a little of the care you give everyone else 🤍",
    setup:
      "Let's find a time that actually works for you. No extra pressure 🤍",
    complete: 'You took a moment for yourself. Carry that with you 🫶',
    waiting:
      "We'll check in again soon. Be a little kind to yourself in the meantime 🤍",
  },
  tobi: {
    future: [
      (time, remaining) =>
        `Oya, hope you're ready for Rewind ${time}. It's in ${remaining}. Small heads-up! 👀`,
      (time, remaining) =>
        `Our check-in is ${time}. ${remaining} to go — bring the gist, even if the gist is “I tried” 😂`,
      (time, remaining) =>
        `Rewind ${time}, in ${remaining}. Don't let your day escape without a small debrief abeg 😭`,
    ],
    open: 'Oya, our Rewind is open. How did today move? Give me the real version 👀',
    setup:
      'First things first — what time are we doing this small daily debrief? 👀',
    complete: 'Daily debrief: handled. Go and breathe small 😂',
    waiting: 'Next Rewind is loading. Go gather fresh gist in the meantime 👀',
  },
  neeja: {
    future: [
      (time, remaining) =>
        `Our Rewind is ${time}, in ${remaining}. Notice what stays with you until then 💭`,
      (time, remaining) =>
        `A little space to connect the dots ${time}. We've got ${remaining} ✨`,
      (time, remaining) =>
        `${remaining} until our check-in ${time}. There might be one useful detail worth keeping 💭`,
    ],
    open: "It's our check-in time. Let's start with whatever has your attention 💭",
    setup: 'Choose a moment in your day when you can hear yourself think 💭',
    complete: 'A few things might be clearer now. Let them settle ✨',
    waiting: "We'll pick up the thread at our next Rewind 💭",
  },
}

function hashScheduleKey(value: string): number {
  let hash = 0
  for (const character of value)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

export function formatRewindTimeRemaining(milliseconds: number): string {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000))
  if (minutes < 60) return `${minutes}min${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}hr${hours === 1 ? '' : 's'}${remainder ? ` ${remainder}min${remainder === 1 ? '' : 's'}` : ''}`
}

export function formatRewindCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return [hours, minutes, seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function localDay(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

export function getRewindScheduleCopy({
  personaId,
  overview,
  now,
  seed,
}: {
  personaId: RewindPersonaId
  overview: RewindRoutineOverview | undefined
  now: number
  seed: string
}): { text: string; countdown: string | null; available: boolean } {
  const copy = PARTNER_COPY[personaId]
  if (!overview)
    return {
      text: 'Finding your next Rewind…',
      countdown: null,
      available: false,
    }
  if (!overview.routine)
    return { text: copy.setup, countdown: null, available: false }
  const current = overview.currentSession
  const next = overview.nextSession
  const currentEndsAt = current?.windowEndsAt
    ? Date.parse(current.windowEndsAt)
    : 0
  const nextStartsAt = next?.scheduledFor ? Date.parse(next.scheduledFor) : 0
  const nextEndsAt = next?.windowEndsAt ? Date.parse(next.windowEndsAt) : 0
  if (
    (current && currentEndsAt > now) ||
    (nextStartsAt > 0 && nextStartsAt <= now && nextEndsAt > now)
  ) {
    return { text: copy.open, countdown: null, available: true }
  }
  if (next && Number.isFinite(nextStartsAt) && nextStartsAt > now) {
    const date = new Date(nextStartsAt)
    const time = new Intl.DateTimeFormat('en', {
      timeZone: overview.timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(date)
      .replace(/\s/g, '')
      .toLowerCase()
      .replace(':00', '')
    const today = localDay(new Date(now), overview.timezone)
    const targetDay = localDay(date, overview.timezone)
    const day = today === targetDay ? '' : 'tomorrow '
    const variant =
      hashScheduleKey(`${seed}:${personaId}:${next.id}`) % copy.future.length
    const remaining = nextStartsAt - now
    return {
      text: copy.future[variant](
        `${day}at ${time}`,
        formatRewindTimeRemaining(remaining),
      ),
      countdown: variant === 2 ? formatRewindCountdown(remaining) : null,
      available: false,
    }
  }
  return {
    text:
      overview.latestSession?.status === 'COMPLETED'
        ? copy.complete
        : copy.waiting,
    countdown: null,
    available: false,
  }
}
