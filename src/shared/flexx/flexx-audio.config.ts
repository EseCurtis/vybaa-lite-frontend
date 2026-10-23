export const FLEXX_SOUNDTRACKS = [
  {
    id: 'curious-pulse',
    src: '/audio/flexx/curious-pulse.mp3',
  },
  {
    id: 'bright-little-steps',
    src: '/audio/flexx/bright-little-steps.mp3',
  },
] as const

export type FlexxSoundtrack = (typeof FLEXX_SOUNDTRACKS)[number]

export function chooseFlexxSoundtrack(
  previousId: string | null,
  random: () => number = Math.random,
): FlexxSoundtrack {
  const available = FLEXX_SOUNDTRACKS.filter((track) => track.id !== previousId)
  const choices = available.length ? available : FLEXX_SOUNDTRACKS
  const randomIndex = Math.floor(random() * choices.length)
  const index = Math.max(0, Math.min(choices.length - 1, randomIndex))
  const soundtrack = choices[index]
  if (!soundtrack) throw new Error('No Flexx soundtrack is configured')
  return soundtrack
}
