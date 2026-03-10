import { Spinner } from '@/components/common/spinner.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInviteByCode, useJoinByInviteCode } from '@/hooks/use-communities.hook'
import { RiGroup2Line } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

interface JoinByCodeSheetProps {
  initialCode?: string
  onSuccess?: (communityId: string) => void
  onClose?: () => void
}

export function JoinByCodeSheet({ initialCode = '', onSuccess, onClose }: JoinByCodeSheetProps) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode.toUpperCase())

  const {
    data: invite,
    isLoading: isLookingUp,
    error: lookupError,
  } = useInviteByCode(code)

  const { mutateAsync: joinCommunity, isPending: isJoining } = useJoinByInviteCode()

  // Auto-fill if code passed externally
  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase())
  }, [initialCode])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
  }

  const handleJoin = async () => {
    if (!invite || !code) return
    const response = await joinCommunity(code)
    if (response.data.community) {
      const communityId = response.data.community.id
      onSuccess?.(communityId)
      onClose?.()
      router.navigate({ to: `/app/community/${communityId}` })
    }
  }

  const isCodeComplete = code.length === 6

  return (
    <View className="space-y-5">
      <Text className="text-white/60 text-sm font-bbh">
        Enter a 6-character invite code to join a community.
      </Text>

      {/* Code input */}
      <View className="items-center space-y-2">
        <input
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="A3K9F2"
          maxLength={6}
          className="w-full text-center text-4xl font-bold font-bbh tracking-widest bg-card-light/10 text-white rounded-2xl py-5 outline-none placeholder-white/20 uppercase"
          autoCapitalize="characters"
          spellCheck={false}
        />
        {!isCodeComplete && (
          <Text className="text-white/30 text-xs font-bbh">
            {6 - code.length} character{6 - code.length !== 1 ? 's' : ''} remaining
          </Text>
        )}
      </View>

      {/* Lookup result */}
      {isCodeComplete && (
        <View className="rounded-2xl bg-card-light/10 p-4">
          {isLookingUp ? (
            <View className="flex-row items-center gap-3">
              <Spinner size="sm" />
              <Text className="text-white/60 text-sm font-bbh">Looking up invite...</Text>
            </View>
          ) : lookupError ? (
            <Text className="text-danger-400 text-sm font-bbh text-center">
              {(lookupError as any)?.response?.data?.msg || 'Invalid or expired invite code'}
            </Text>
          ) : invite ? (
            <View className="flex-row items-center gap-3">
              {invite.community.coverImage ? (
                <img
                  src={invite.community.coverImage}
                  alt={invite.community.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
              ) : (
                <View className="w-12 h-12 rounded-xl bg-card-lighter flex items-center justify-center shrink-0">
                  <RiGroup2Line size={22} className="text-white/60" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white font-bold font-bbh">{invite.community.name}</Text>
                {invite.community.description && (
                  <Text className="text-white/50 text-xs font-bbh" numberOfLines={1}>
                    {invite.community.description}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  {invite.community._count.members} member{invite.community._count.members !== 1 ? 's' : ''}
                  {invite.invitedBy?.username ? ` · Invited by @${invite.invitedBy.username}` : ''}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      <Button
        label={isJoining ? 'Joining...' : 'Join Community'}
        variant="default"
        fullWidth
        onClick={handleJoin}
        loading={isJoining}
        disabled={!isCodeComplete || !invite || isLookingUp || isJoining}
        textClassName="text-sm font-bold"
      />
    </View>
  )
}
