export type CommunityIllustrationId =
  | 'arc'
  | 'bloom'
  | 'current'
  | 'grid'
  | 'orbit'
  | 'pulse'

export interface CommunityIllustration {
  accent: string
  background: string
  id: CommunityIllustrationId
  label: string
  soft: string
}

export const COMMUNITY_ILLUSTRATION_PREFIX = 'illustration:'

export const communityIllustrations: CommunityIllustration[] = [
  {
    accent: '#68E1FD',
    background: '#10233F',
    id: 'orbit',
    label: 'Orbit',
    soft: '#8B5CF6',
  },
  {
    accent: '#F97316',
    background: '#2A1A15',
    id: 'pulse',
    label: 'Pulse',
    soft: '#FACC15',
  },
  {
    accent: '#34D399',
    background: '#0F2F28',
    id: 'bloom',
    label: 'Bloom',
    soft: '#A7F3D0',
  },
  {
    accent: '#F472B6',
    background: '#2C1630',
    id: 'arc',
    label: 'Arc',
    soft: '#C084FC',
  },
  {
    accent: '#60A5FA',
    background: '#111C34',
    id: 'grid',
    label: 'Grid',
    soft: '#22D3EE',
  },
  {
    accent: '#FDE047',
    background: '#1F2413',
    id: 'current',
    label: 'Current',
    soft: '#4ADE80',
  },
]

export function getCommunityIllustrationToken(
  id: CommunityIllustrationId,
): string {
  return `${COMMUNITY_ILLUSTRATION_PREFIX}${id}`
}

export function isCommunityIllustrationToken(value?: string | null): boolean {
  return Boolean(value?.startsWith(COMMUNITY_ILLUSTRATION_PREFIX))
}

export function getCommunityIllustration(
  value: string | null | undefined,
  seed: string,
): CommunityIllustration {
  if (value?.startsWith(COMMUNITY_ILLUSTRATION_PREFIX)) {
    const id = value.slice(
      COMMUNITY_ILLUSTRATION_PREFIX.length,
    ) as CommunityIllustrationId
    const match = communityIllustrations.find((item) => item.id === id)
    if (match) {
      return match
    }
  }

  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }

  return communityIllustrations[
    Math.abs(hash) % communityIllustrations.length
  ]!
}
