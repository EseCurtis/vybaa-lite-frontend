import type {
  CardType,
  FlexxStats,
} from '@/components/custom/flexx/flexx-card.component'
import type { RewindInsights } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

export const FLEXX_CATEGORIES = [
  'daily',
  'weekly',
  'streak',
  'rewind',
  'achievement',
] as const
export const FLEXX_LAYOUTS = [
  'billboard',
  'split',
  'ledger',
  'ring',
  'statement',
  'emblem',
  'questionnaire',
] as const
export const FLEXX_PALETTES = [
  'ink',
  'rose',
  'mint',
  'amber',
  'slate',
  'plum',
] as const
export const FLEXX_METRICS = [
  'totalGoals',
  'totalCheckIns',
  'currentStreak',
  'longestStreak',
  'completionRate',
  'averageProgress',
  'rewindSessions',
  'rewindConsistency',
] as const
export type FlexxCategory = 'all' | CardType
export type FlexxMetric = (typeof FLEXX_METRICS)[number]
export type FlexxSlot = 'aside' | 'bottomLeft' | 'bottomRight' | 'hero'
export type FlexxAuthor = { partnerIds: RewindPersonaId[] }
export type FlexxQuestion = { question: string; options: string[] }
export type FlexxDesign = {
  id: string
  category: CardType
  layout: (typeof FLEXX_LAYOUTS)[number]
  palette: (typeof FLEXX_PALETTES)[number]
  headline: string
  align: 'center' | 'left'
  symbol: 'bolt' | 'flame' | 'rewind' | 'spark' | 'trophy'
  blocks: Array<{ slot: FlexxSlot; metric: FlexxMetric }>
  author: FlexxAuthor
  likedBy: RewindPersonaId[]
  questionnaire: FlexxQuestion | null
}
export type FlexxDesignPage = {
  version: 1
  source: 'ai' | 'fallback'
  designs: FlexxDesign[]
  nextCursor: string | null
}

export const FLEXX_THEMES = {
  ink: {
    background: colors.cardd,
    foreground: colors.white,
    accent: colors.accent[100],
    secondary: colors['card-lighter-3'],
  },
  rose: {
    background: colors.accent[100],
    foreground: colors.black,
    accent: colors.accent[900],
    secondary: colors.accent[900],
  },
  mint: {
    background: colors.success[300],
    foreground: colors.black,
    accent: colors.success[900],
    secondary: colors.success[900],
  },
  amber: {
    background: colors.warning[300],
    foreground: colors.black,
    accent: colors.warning[900],
    secondary: colors.warning[900],
  },
  slate: {
    background: colors['card-light-100'],
    foreground: colors.white,
    accent: colors.success[300],
    secondary: colors['card-lighter-3'],
  },
  plum: {
    background: colors.accent[900],
    foreground: colors.white,
    accent: colors.warning[200],
    secondary: colors.accent[50],
  },
} as const

const CATEGORY_METRICS: Record<CardType, FlexxMetric[]> = {
  daily: ['totalCheckIns', 'totalGoals', 'currentStreak', 'completionRate'],
  weekly: [
    'averageProgress',
    'totalGoals',
    'totalCheckIns',
    'currentStreak',
    'completionRate',
  ],
  streak: ['currentStreak', 'longestStreak', 'totalCheckIns', 'completionRate'],
  rewind: ['rewindSessions', 'rewindConsistency'],
  achievement: [],
}

export function metricValue(
  metric: FlexxMetric,
  stats: FlexxStats,
  rewind?: RewindInsights,
): { label: string; value: number; formatted: string; percentage: boolean } {
  const labels: Record<FlexxMetric, string> = {
    totalGoals: 'goals',
    totalCheckIns: 'check-ins',
    currentStreak: 'day streak',
    longestStreak: 'personal best',
    completionRate: 'completion',
    averageProgress: 'progress',
    rewindSessions: 'Rewinds',
    rewindConsistency: 'reflection consistency',
  }
  let value: number
  if (metric === 'rewindSessions')
    value = rewind?.coverage.completedSessions ?? 0
  else if (metric === 'rewindConsistency')
    value = rewind?.progress?.consistency ?? 0
  else value = stats[metric]
  const percentage = [
    'completionRate',
    'averageProgress',
    'rewindConsistency',
  ].includes(metric)
  return {
    label: labels[metric],
    value,
    percentage,
    formatted: percentage ? `${Math.round(value)}%` : String(value),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function member<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === 'string' && values.some((entry) => entry === value)
}

function parsePartnerIds(
  value: unknown,
  min: number,
  max: number,
): RewindPersonaId[] {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    throw new Error('Invalid Flexx partners')
  const ids = value.map((id: unknown) => {
    const partner = REWIND_PERSONAS.find((entry) => entry.id === id)
    if (!partner) throw new Error('Unknown Flexx partner')
    return partner.id
  })
  if (new Set(ids).size !== ids.length)
    throw new Error('Duplicate Flexx partners')
  return ids
}

function parseAuthor(value: unknown): FlexxAuthor {
  if (value === undefined) return { partnerIds: ['ella'] }
  if (!isRecord(value)) throw new Error('Invalid Flexx author')
  if ('partnerIds' in value)
    return { partnerIds: parsePartnerIds(value.partnerIds, 1, 3) }
  // Older cached maps are mapped to AI partners, never to the current user.
  if (value.kind === 'self' && value.partnerId === null)
    return { partnerIds: ['ella'] }
  const partner = REWIND_PERSONAS.find((entry) => entry.id === value.partnerId)
  if ((value.kind === 'group' || value.kind === 'partner') && partner)
    return {
      partnerIds:
        value.kind === 'group'
          ? [partner.id, partner.id === 'ella' ? 'lyra' : 'ella']
          : [partner.id],
    }
  throw new Error('Invalid Flexx author')
}

function parseQuestion(value: unknown): FlexxQuestion | null {
  if (value === undefined || value === null) return null
  if (
    !isRecord(value) ||
    typeof value.question !== 'string' ||
    value.question.trim().length < 8 ||
    value.question.length > 180 ||
    !Array.isArray(value.options) ||
    value.options.length < 2 ||
    value.options.length > 4
  )
    throw new Error('Invalid Flexx question')
  const options = value.options.map((entry: unknown) => {
    if (typeof entry !== 'string' || !entry.trim() || entry.length > 64)
      throw new Error('Invalid question option')
    return entry.trim()
  })
  if (new Set(options).size !== options.length)
    throw new Error('Duplicate question options')
  return { question: value.question.trim(), options }
}

export function parseFlexxDesign(value: unknown): FlexxDesign {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.length > 160 ||
    !member(FLEXX_CATEGORIES, value.category) ||
    !member(FLEXX_LAYOUTS, value.layout) ||
    (!member(FLEXX_PALETTES, value.palette) && value.palette !== 'paper') ||
    !member(['left', 'center'] as const, value.align) ||
    !member(
      ['bolt', 'flame', 'spark', 'rewind', 'trophy'] as const,
      value.symbol,
    ) ||
    typeof value.headline !== 'string' ||
    !value.headline.trim() ||
    value.headline.length > 48 ||
    !/^[\p{L}\s.,!?&'’—-]+$/u.test(value.headline) ||
    !Array.isArray(value.blocks) ||
    value.blocks.length > 4
  )
    throw new Error('Invalid Flexx composition')
  const category = value.category
  const author = parseAuthor(value.author)
  const likedBy = parsePartnerIds(value.likedBy ?? [], 0, 6)
  const questionnaire = parseQuestion(value.questionnaire)
  const blocks = value.blocks.map((block: unknown) => {
    if (
      !isRecord(block) ||
      !member(
        ['hero', 'aside', 'bottomLeft', 'bottomRight'] as const,
        block.slot,
      ) ||
      !member(FLEXX_METRICS, block.metric) ||
      !CATEGORY_METRICS[category].includes(block.metric)
    )
      throw new Error('Invalid Flexx metric binding')
    return { slot: block.slot, metric: block.metric }
  })
  if (
    new Set(blocks.map((block) => block.slot)).size !== blocks.length ||
    new Set(blocks.map((block) => block.metric)).size !== blocks.length
  )
    throw new Error('Duplicate Flexx bindings')
  if (questionnaire) {
    if (
      category !== 'rewind' ||
      value.layout !== 'questionnaire' ||
      blocks.length
    )
      throw new Error('Invalid questionnaire layout')
  } else if (value.layout === 'questionnaire')
    throw new Error('Missing questionnaire')
  else if (category === 'achievement') {
    if (blocks.length || value.layout !== 'emblem')
      throw new Error('Invalid achievement composition')
  } else if (
    !blocks.some((block) => block.slot === 'hero') ||
    value.layout === 'emblem'
  )
    throw new Error('Missing Flexx hero')
  if (
    value.layout === 'ring' &&
    !['completionRate', 'averageProgress', 'rewindConsistency'].includes(
      blocks.find((block) => block.slot === 'hero')?.metric ?? '',
    )
  )
    throw new Error('Invalid ring value')
  return {
    id: value.id,
    category,
    layout: value.layout,
    palette: value.palette === 'paper' ? 'slate' : value.palette,
    headline: value.headline,
    align: value.align,
    symbol: value.symbol,
    blocks,
    author,
    likedBy,
    questionnaire,
  }
}

export function parseFlexxPage(value: unknown): FlexxDesignPage {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !member(['ai', 'fallback'] as const, value.source) ||
    !Array.isArray(value.designs) ||
    value.designs.length > 12 ||
    (value.nextCursor !== null &&
      (typeof value.nextCursor !== 'string' || value.nextCursor.length > 800))
  )
    throw new Error('Invalid Flexx design page')
  const designs = value.designs.map(parseFlexxDesign)
  if (new Set(designs.map((design) => design.id)).size !== designs.length)
    throw new Error('Duplicate design IDs')
  return {
    version: 1,
    source: value.source,
    designs,
    nextCursor: value.nextCursor,
  }
}

export function starterFlexxDesigns(
  category: FlexxCategory,
  seed: number,
): FlexxDesign[] {
  const categories = category === 'all' ? FLEXX_CATEGORIES : [category]
  const layouts = ['billboard', 'split', 'statement', 'ledger'] as const
  const palettes = ['rose', 'ink', 'amber', 'mint', 'slate', 'plum'] as const
  return Array.from({ length: 10 }, (_, index) => {
    const type = categories[index % categories.length] ?? 'daily'
    const metricList = CATEGORY_METRICS[type]
    const slots: FlexxSlot[] = ['hero', 'bottomLeft', 'bottomRight']
    const rotation = (seed + index) % Math.max(1, metricList.length)
    const ordered = [
      ...metricList.slice(rotation),
      ...metricList.slice(0, rotation),
    ].slice(0, 3)
    return parseFlexxDesign({
      id: `starter:${category}:${index}`,
      category: type,
      author: {
        partnerIds:
          index % 3 === 2
            ? ['ella', 'lyra']
            : [
                REWIND_PERSONAS[(seed + index) % REWIND_PERSONAS.length]?.id ??
                  'ella',
              ],
      },
      likedBy: [],
      questionnaire: null,
      layout:
        type === 'achievement'
          ? 'emblem'
          : layouts[(seed + index) % layouts.length],
      palette: palettes[(seed + index) % palettes.length],
      headline: {
        daily: ['Showed up.', 'In the making.'],
        weekly: ['The bigger picture.', 'A little further.'],
        streak: ['Still going.', 'One more day.'],
        rewind: ['Room to reflect.', 'A moment, kept.'],
        achievement: ['Earned, not given.', 'A little proud.'],
      }[type][index % 2],
      align: index % 2 ? 'center' : 'left',
      symbol: {
        daily: 'bolt',
        weekly: 'spark',
        streak: 'flame',
        rewind: 'rewind',
        achievement: 'trophy',
      }[type],
      blocks: ordered.map((metric, position) => ({
        metric,
        slot: slots[position],
      })),
    })
  })
}

export function compositionKey(design: FlexxDesign): string {
  return JSON.stringify([
    design.category,
    design.layout,
    design.palette,
    design.headline,
    design.align,
    design.symbol,
    design.blocks,
    ...(design.questionnaire ? [design.questionnaire] : []),
  ])
}
