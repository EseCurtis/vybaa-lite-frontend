import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { usePublicProfile } from '@/hooks/use-public-profile.hook'
import { useAuth } from '@/providers/auth.provider'
import {
  RiBookOpenLine,
  RiCoinsLine,
  RiGroupLine,
  RiMedalLine,
} from '@remixicon/react'
import { useNavigate, useParams } from '@tanstack/react-router'
import moment from 'moment'

function getPublicProfileDisplayName(profile: {
  email?: string
  firstName: string | null
  lastName: string | null
  username: string | null
}): string {
  return (
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    profile.username ||
    profile.email ||
    'User'
  )
}

function getPublicProfileInitials(profile: {
  firstName: string | null
  lastName: string | null
  username: string | null
}): string {
  const initials =
    [profile.firstName?.[0], profile.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || profile.username?.[0]?.toUpperCase()

  return initials || 'U'
}

export default function PublicProfileScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { username } = useParams({ from: '/app/u/$username' })
  const { data: profile, isLoading, isError } = usePublicProfile(username)

  const isOwnPublicProfile = user?.username === username

  if (isLoading) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Profile" />
          <View className="gap-4 px-mg py-5">
            <View className="items-center gap-3">
              <Skeleton className="size-24" rounded="full" />
              <Skeleton className="h-5 w-40" rounded="sm" />
              <Skeleton className="h-3 w-24" rounded="sm" />
            </View>
            <Skeleton className="h-40 w-full" rounded="xl" />
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Profile" />
          <EmptyList
            icon={<RiGroupLine size={48} className="text-white/40" />}
            title="Profile not found"
            description="That user profile is not available right now."
            action={{
              label: 'Go back',
              onPress: () => {
                navigate({ replace: true, to: '/app/profile' })
              },
            }}
          />
        </NoiseComponent>
      </View>
    )
  }

  const displayName = getPublicProfileDisplayName(profile)
  const initials = getPublicProfileInitials(profile)

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      <NoiseComponent>
        <TabHeader title="Profile" />

        <View className="px-mg pb-20 pt-3 space-y-5">
          <View className="rounded-[28px] bg-card-light/25 p-5">
            <View className="flex-row items-center gap-4">
              <View className="w-20 h-20 rounded-full bg-card-light/60 overflow-hidden items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Text className="text-white text-2xl font-bbh font-bold">
                    {initials}
                  </Text>
                )}
              </View>

              <View className="flex-1 min-w-0">
                <Text className="text-white text-2xl font-bbh font-bold">
                  {displayName}
                </Text>
                <Text className="text-white/50 text-sm font-bbh mt-1">
                  @{profile.username}
                </Text>
                <Text className="text-white/45 text-xs font-bbh mt-2">
                  Joined {moment(profile.joinedAt).format('MMM D, YYYY')}
                </Text>
              </View>
            </View>

            {profile.currentMood ? (
              <View className="mt-3 rounded-2xl bg-card-light/20 px-4 py-3 flex-row items-center justify-between">
                <Text className="text-white/50 text-xs uppercase tracking-[0.18em] font-bbh">
                  Current mood
                </Text>
                <Text className="text-white text-sm font-bbh font-semibold">
                  {profile.currentMood}
                </Text>
              </View>
            ) : null}

            {isOwnPublicProfile ? (
              <View className="mt-4">
                <Button
                  label="Open editable profile"
                  fullWidth
                  onClick={() => {
                    navigate({ to: '/app/profile' })
                  }}
                />
              </View>
            ) : null}
          </View>

          <View className="grid grid-cols-2 gap-3">
            <PublicProfileStatCard
              icon={<RiCoinsLine size={18} className="text-accent-400" />}
              label="Play Points"
              value={profile.playPoints.toLocaleString()}
            />
            <PublicProfileStatCard
              icon={<RiMedalLine size={18} className="text-accent-400" />}
              label="Achievements"
              value={profile.stats.achievementCount.toLocaleString()}
            />
            <PublicProfileStatCard
              icon={<RiBookOpenLine size={18} className="text-accent-400" />}
              label="Journals"
              value={profile.stats.journalCount.toLocaleString()}
            />
            <PublicProfileStatCard
              icon={<RiGroupLine size={18} className="text-accent-400" />}
              label="Communities"
              value={profile.stats.communityCount.toLocaleString()}
            />
          </View>

          <View className="rounded-[28px] bg-card-light/20 p-5">
            <Text className="text-white/45 text-[11px] uppercase tracking-[0.18em] font-bbh">
              Activity footprint
            </Text>
            <Text className="text-white text-lg font-bbh font-bold mt-2">
              {profile.stats.goalCount.toLocaleString()} goal
              {profile.stats.goalCount === 1 ? '' : 's'} started
            </Text>
            <Text className="text-white/55 text-sm font-bbh mt-2">
              This public view is intentionally lightweight and only shows safe
              profile fields plus aggregate counts.
            </Text>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}

function PublicProfileStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <View className="rounded-3xl bg-card-light/20 p-4">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-white/50 text-xs font-bbh">{label}</Text>
      </View>
      <Text className="text-white text-2xl font-bbh font-bold mt-3">
        {value}
      </Text>
    </View>
  )
}
