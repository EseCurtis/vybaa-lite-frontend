import { Icon } from '@iconify/react'
import {
  RiFireFill,
  RiFlashlightFill,
  RiRewindFill,
  RiSparklingFill,
  RiTrophyFill,
} from '@remixicon/react'
import type { ReactElement } from 'react'

import { VybaaMark } from '@/components/common/vybaa-mark.component'
import type { AvatarUser } from '@/components/user/avatar.component'
import { Avatar } from '@/components/user/avatar.component'
import { UserCheckmark } from '@/components/user/checkmark.component'
import type { FlexxDesign, FlexxMetric } from '@/shared/flexx/flexx-design'
import { FLEXX_THEMES, metricValue } from '@/shared/flexx/flexx-design'
import { flexxPresentation } from '@/shared/flexx/flexx-presentation'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { cn } from '@/shared/utils/helpers.util'
import type { FlexxCardProps } from './flexx-card.component'
import { FlexxPartnerExpression } from './flexx-partner-expression.component'

const SYMBOLS = {
  bolt: RiFlashlightFill,
  flame: RiFireFill,
  rewind: RiRewindFill,
  spark: RiSparklingFill,
  trophy: RiTrophyFill,
}
const GRIDS = {
  billboard: {
    areas: '"hero hero" "bottomLeft bottomRight" "aside aside"',
    rows: 'minmax(0,1fr) auto auto',
  },
  split: {
    areas: '"hero aside" "bottomLeft bottomRight"',
    rows: 'minmax(0,1fr) auto',
  },
  ledger: {
    areas: '"hero hero" "aside aside" "bottomLeft bottomRight"',
    rows: 'minmax(0,1fr) auto auto',
  },
  statement: {
    areas: '"hero hero" "bottomLeft bottomRight" "aside aside"',
    rows: 'minmax(0,1fr) auto auto',
  },
  ring: {
    areas: '"hero hero" "bottomLeft bottomRight" "aside aside"',
    rows: 'minmax(0,1fr) auto auto',
  },
  emblem: { areas: '"hero hero"', rows: 'minmax(0,1fr)' },
  questionnaire: { areas: '"hero hero"', rows: 'minmax(0,1fr)' },
} as const

function MetricBlock({
  metric,
  hero,
  design,
  data,
  rewind,
  loop,
}: {
  metric: FlexxMetric
  hero: boolean
  design: FlexxDesign
  loop: boolean
} & Pick<FlexxCardProps, 'data' | 'rewind'>): ReactElement {
  const item = metricValue(metric, data, rewind ?? undefined)
  const theme = FLEXX_THEMES[design.palette]
  const ring = hero && design.layout === 'ring'
  let fontSize = '12cqw'
  if (hero) {
    fontSize = design.layout === 'statement' ? '24cqw' : '38cqw'
    if (design.layout === 'split') fontSize = '24cqw'
    if (design.layout === 'ledger') fontSize = '29cqw'
    if (ring) fontSize = '20cqw'
    if (item.formatted.length >= 5) fontSize = '22cqw'
    if (design.layout === 'split') {
      fontSize = `${Math.min(24, 65 / item.formatted.length)}cqw`
    }
  }
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-col justify-center gap-[2cqw]',
        design.align === 'center' && 'items-center !text-center',
        ring &&
          'aspect-square w-full max-w-[66cqw] justify-self-center items-center justify-center !text-center',
      )}
    >
      {ring ? (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={theme.secondary}
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={theme.accent}
            strokeWidth="6"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${Math.max(0, Math.min(100, item.value))} 100`}
          />
        </svg>
      ) : null}
      <span
        data-flexx-loop={loop ? 'metric' : undefined}
        className="relative block max-w-full break-words font-display font-extrabold leading-[0.95] tracking-tighter tabular-nums"
        style={{ fontSize, color: hero ? theme.foreground : theme.accent }}
      >
        {item.formatted}
      </span>
      <span
        className="relative font-bbh text-[clamp(11px,3.8cqw,16px)] leading-snug"
        style={{ color: theme.secondary }}
      >
        {item.label}
      </span>
    </div>
  )
}

export function FlexxFeedCard({
  design,
  data,
  username,
  userAvatarUrl,
  achievement,
  rewind,
  user,
  animate = false,
}: FlexxCardProps & {
  design: FlexxDesign
  user?: AvatarUser
  animate?: boolean
}): ReactElement {
  const theme = FLEXX_THEMES[design.palette]
  const Symbol = SYMBOLS[design.symbol]
  const grid = GRIDS[design.layout]
  const centered = design.align === 'center'
  const isEmblem = design.category === 'achievement'
  const presentation = flexxPresentation(design)
  const partnerId = design.author.partnerIds[0]
  let expression = presentation.expression
  if (
    (isEmblem && !achievement) ||
    (design.category === 'streak' && data.currentStreak < 1)
  )
    expression = expression ? 'calm' : null
  const headlineSize = Math.min(
    design.layout === 'statement' ? 19 : 13,
    420 / design.headline.length,
  )
  const earnedDate = achievement
    ? new Date(achievement.earnedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  return (
    <div
      data-flexx-layout={design.layout}
      data-flexx-palette={design.palette}
      data-flexx-animate={animate}
      className="size-full min-w-0 overflow-hidden"
      style={{
        containerType: 'inline-size',
        backgroundColor: theme.background,
        color: theme.foreground,
      }}
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-[6cqw] p-[7cqw]">
        <div
          className={cn(
            'flex flex-col gap-[5cqw]',
            centered && 'items-center !text-center',
          )}
        >
          <div
            className={cn(
              'flex w-full items-center justify-between',
              centered && !expression && 'justify-center',
            )}
          >
            <div
              data-flexx-loop={
                presentation.loop === 'symbol' ? 'symbol' : undefined
              }
            >
              <Symbol
                aria-hidden="true"
                className={
                  design.layout === 'split' ? 'size-[18cqw]' : 'size-[10cqw]'
                }
                style={{ color: theme.accent }}
              />
            </div>
            {expression && partnerId ? (
              <FlexxPartnerExpression
                partnerId={partnerId}
                expression={expression}
                className="w-[28cqw]"
              />
            ) : null}
          </div>
          <h2
            data-flexx-loop={
              presentation.loop === 'headline' ? 'headline' : undefined
            }
            className="w-full break-words font-display font-extrabold leading-[0.98] tracking-tighter"
            style={{
              fontSize: `${headlineSize}cqw`,
            }}
          >
            {design.headline}
          </h2>
        </div>
        {isEmblem ? (
          <div className="flex min-h-0 flex-col items-center justify-center gap-[5cqw] !text-center">
            {achievement ? (
              <>
                <Icon
                  icon={getEmojiIcon(achievement.badgeIcon)}
                  className="size-[36cqw] shrink-0"
                />
                <p className="w-full break-words font-display text-[8cqw] font-extrabold leading-tight">
                  {achievement.title}
                </p>
                <p
                  className="font-bbh text-[3.6cqw] leading-relaxed"
                  style={{ color: theme.secondary }}
                >
                  {achievement.description}
                </p>
                {achievement.type === 'streak_milestone' ? (
                  <span className="font-bbh text-[4cqw] font-bold">
                    {achievement.milestone} day streak
                  </span>
                ) : null}
                {achievement.type === 'total_goals' ? (
                  <span className="font-bbh text-[4cqw] font-bold">
                    {achievement.milestone} goals
                  </span>
                ) : null}
                {achievement.type === 'total_checkins' ? (
                  <span className="font-bbh text-[4cqw] font-bold">
                    {achievement.milestone} check-ins
                  </span>
                ) : null}
                {earnedDate ? (
                  <span
                    className="font-bbh text-[3cqw]"
                    style={{ color: theme.secondary }}
                  >
                    {earnedDate}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <RiTrophyFill
                  className="size-[32cqw]"
                  style={{ color: theme.accent }}
                />
                <p className="font-bbh text-[4.5cqw]">Choose an achievement</p>
              </>
            )}
          </div>
        ) : (
          <div
            className="grid min-h-0 grid-cols-2 gap-x-[6cqw] gap-y-[5cqw]"
            style={{
              gridTemplateAreas: grid.areas,
              gridTemplateRows: grid.rows,
            }}
          >
            {design.blocks.map((block) => (
              <div
                key={block.slot}
                className="grid min-h-0 min-w-0"
                style={{ gridArea: block.slot }}
              >
                <MetricBlock
                  metric={block.metric}
                  hero={block.slot === 'hero'}
                  design={design}
                  data={data}
                  rewind={rewind}
                  loop={block.slot === 'hero' && presentation.loop === 'metric'}
                />
              </div>
            ))}
          </div>
        )}
        <div className=" shrink-0 hidden items-center justify-between gap-3 pt-[3cqw]">
          <div className="flex min-w-0 items-center gap-[3cqw]">
            <Avatar
              user={user ?? { username, avatarUrl: userAvatarUrl }}
              size="8cqw"
            />
            <div className="flex min-w-0 flex-row items-center gap-1 font-bbh text-[3.5cqw] font-semibold leading-relaxed">
              <span className="break-all">
                {username ? `@${username}` : 'Vybaa'}
              </span>
              <UserCheckmark />
            </div>
          </div>
          <VybaaMark
            tone={
              design.palette === 'ink' ||
              design.palette === 'plum' ||
              design.palette === 'slate'
                ? 'white'
                : 'dark'
            }
            className="size-[7cqw] shrink-0 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
