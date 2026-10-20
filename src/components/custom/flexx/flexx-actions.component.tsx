import {
  RiHeartFill,
  RiHeartLine,
  RiRefreshLine,
  RiShareForwardFill,
  RiTrophyLine,
} from '@remixicon/react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import type { FlexxDesign } from '@/shared/flexx/flexx-design'
import { Avatar } from '@/components/user/avatar.component'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { FlexxAuthorIdentity } from './flexx-author.component'

export function FlexxActions({
  label,
  foreground,
  liked,
  ready,
  likeEnabled,
  onLike,
  onShare,
  achievement,
  more,
  author,
  likedBy,
}: {
  label: string
  foreground: string
  liked: boolean
  ready: boolean
  likeEnabled: boolean
  onLike: () => void
  onShare: () => void
  achievement?: { label: string; ready: boolean; onPress: () => void }
  more?: { loading: boolean; onPress: () => void }
  author: FlexxDesign['author']
  likedBy: FlexxDesign['likedBy']
}): ReactElement {
  const Heart = liked ? RiHeartFill : RiHeartLine
  const likeAccessibilityLabel = `${liked ? 'Unlike' : 'Like'} ${label} Flexx`
  const partners = likedBy.map(getRewindPersona)
  const actionClass =
    'min-h-14 w-12 flex-col items-center justify-center gap-1 rounded-full !transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:text-card-lighter-3'
  return (
    <div
      role="group"
      aria-label={`${label} Flexx actions`}
      className="flex w-16 shrink-0 flex-col items-center justify-end gap-2 px-2"
      style={{
        color: foreground,
        paddingBottom:
          'max(24px, calc(var(--safe-area-inset-bottom, 0px) + 16px))',
      }}
    >
      {achievement ? (
        <Pressable
          type="button"
          accessibilityLabel={achievement.label}
          disabled={!achievement.ready}
          onPress={achievement.onPress}
          className={actionClass}
        >
          <RiTrophyLine size={25} aria-hidden="true" />
          <span className="font-bbh text-[10px] font-semibold">Badge</span>
        </Pressable>
      ) : null}
      <FlexxAuthorIdentity author={author} />
      <Pressable
        type="button"
        accessibilityLabel={likeAccessibilityLabel}
        aria-pressed={liked}
        disabled={!likeEnabled || !ready}
        onPress={onLike}
        className={actionClass}
      >
        <Heart size={29} aria-hidden="true" />
        <span className="font-bbh text-[10px] font-semibold">
          {liked ? 'Liked' : 'Like'}
        </span>
      </Pressable>
      {partners.length ? (
        <div
          role="img"
          aria-label={`Liked by ${partners.map((partner) => partner.name).join(', ')}, AI partners`}
          className="flex w-12 flex-col items-center gap-1"
          title={`Liked by ${partners.map((partner) => partner.name).join(', ')}`}
        >
          <div aria-hidden="true" className="flex -space-x-2">
            {partners.slice(0, 3).map((partner) => (
              <Avatar
                key={partner.id}
                user={{
                  id: partner.id,
                  firstName: partner.name,
                  avatarUrl: partner.avatar,
                }}
                size={20}
              />
            ))}
          </div>
          <span className="font-bbh text-[9px] leading-tight">Liked by</span>
        </div>
      ) : null}
      <Pressable
        type="button"
        accessibilityLabel={`Share ${label} Flexx`}
        disabled={!ready}
        onPress={onShare}
        className={actionClass}
      >
        <RiShareForwardFill size={28} aria-hidden="true" />
        <span className="font-bbh text-[10px] font-semibold">Share</span>
      </Pressable>
      {more ? (
        <Pressable
          type="button"
          accessibilityLabel="Load more Flexx designs"
          disabled={more.loading}
          onPress={more.onPress}
          className={actionClass}
        >
          <RiRefreshLine size={24} aria-hidden="true" />
          <span className="font-bbh text-[10px] font-semibold">
            {more.loading ? 'Loading…' : 'More'}
          </span>
        </Pressable>
      ) : null}
    </div>
  )
}
