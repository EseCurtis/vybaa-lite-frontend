import { Input } from '@/components/common/input.component'
import { Spinner } from '@/components/common/spinner.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCommunityInvites,
  useCreateInvite,
  useRevokeInvite,
} from '@/hooks/use-communities.hook'
import {
  RiAddLine,
  RiCheckLine,
  RiClipboardLine,
  RiDeleteBinLine,
  RiLinkM,
  RiUserLine,
} from '@remixicon/react'
import { useState } from 'react'

interface InviteSheetProps {
  communityId: string
  communityName: string
}

export function InviteSheet({ communityId, communityName }: InviteSheetProps) {
  const [tab, setTab] = useState<'share' | 'username'>('share')
  const [usernameInput, setUsernameInput] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: invites, isLoading: isLoadingInvites, refetch } = useCommunityInvites(communityId)
  const { mutateAsync: createInvite, isPending: isCreating } = useCreateInvite()
  const { mutateAsync: revokeInvite, isPending: isRevoking } = useRevokeInvite()

  // The general shareable link invite (first one with maxUses=-1 and no invitee)
  const generalInvite = invites?.find((inv) => !inv.inviteeUsername && !inv.inviteeEmail && !inv.isExpired && !inv.isMaxed)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiedCode('link-' + link)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleGenerateCode = async () => {
    await createInvite({ communityId })
    refetch()
  }

  const handleInviteByUsername = async () => {
    const trimmed = usernameInput.trim().replace(/^@/, '')
    if (!trimmed) return
    await createInvite({ communityId, data: { inviteeUsername: trimmed } })
    setUsernameInput('')
    refetch()
    setTab('share')
  }

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Revoke this invite?')) return
    await revokeInvite(inviteId)
    refetch()
  }

  return (
    <View className="space-y-5">
      {/* Tab switcher */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setTab('share')}
          className={`flex-1 py-2 flex   justify-center rounded-full text-center ${tab === 'share' ? 'bg-accent-500' : 'bg-card-light/20'}`}
        >
          <Text className={`text-xs font-bbh text-center ${tab === 'share' ? 'text-white font-bold' : 'text-white/70'}`}>
            Share Link / Code
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('username')}
          className={`flex-1 py-2 flex   justify-center rounded-full text-center ${tab === 'username' ? 'bg-accent-500' : 'bg-card-light/20'}`}
        >
          <Text className={`text-xs font-bbh text-center ${tab === 'username' ? 'text-white font-bold' : 'text-white/70'}`}>
            Invite by Username
          </Text>
        </Pressable>
      </View>

      {tab === 'share' ? (
        <View className="space-y-4">
          {isLoadingInvites ? (
            <View className="items-center py-6">
              <Spinner />
            </View>
          ) : generalInvite ? (
            <>
              {/* Big code display */}
              <View className="rounded-2xl bg-card-lighter/10 p-5 items-center space-y-3">
                <Text className="text-white/50 text-xs font-bbh">Invite Code</Text>
                <Pressable onPress={() => handleCopyCode(generalInvite.code)} className="items-center gap-1 flex-row">
                  <Text className="text-white text-4xl font-bold font-bbh tracking-widest">
                    {generalInvite.code}
                  </Text>
                  {copiedCode === generalInvite.code ? (
                    <RiCheckLine size={20} className="text-accent-400" />
                  ) : (
                    <RiClipboardLine size={20} className="text-white/40" />
                  )}
                </Pressable>
                <Text className="text-white/40 text-xs font-bbh">Tap to copy</Text>
              </View>

              {/* Link copy */}
              <Pressable
                onPress={() => handleCopyLink(generalInvite.link)}
                className="flex-row items-center gap-3 rounded-2xl bg-card-light/10 px-4 py-3"
              >
                <RiLinkM size={18} className="text-white/60 shrink-0" />
                <Text className="flex-1 text-white/60 text-xs font-bbh truncate">
                  {generalInvite.link}
                </Text>
                {copiedCode === `link-${generalInvite.link}` ? (
                  <RiCheckLine size={16} className="text-accent-400 shrink-0" />
                ) : (
                  <RiClipboardLine size={16} className="text-white/40 shrink-0" />
                )}
              </Pressable>

              <Text className="text-white/40 text-xs font-bbh text-center">
                Anyone with this code or link can join {communityName}
              </Text>

              <Button
                label="Generate new code"
                variant="ghost"
                fullWidth
                onClick={handleGenerateCode}
                loading={isCreating}
                disabled={isCreating}
                textClassName="text-xs"
                className="!bg-card-light/10"
              />
            </>
          ) : (
            <View className="items-center space-y-4 py-4">
              <Text className="text-white/60 text-sm font-bbh text-center">
                No active invite code yet. Generate one to share with others.
              </Text>
              <Button
                label="Generate invite code"
                variant="default"
                fullWidth
                onClick={handleGenerateCode}
                loading={isCreating}
                disabled={isCreating}
                textClassName="text-sm"
                rightIcon={<RiAddLine color="#000" size={16} />}
              />
            </View>
          )}

          {/* Active targeted invites */}
          {invites && invites.filter((inv) => inv.inviteeUsername || inv.inviteeEmail).length > 0 && (
            <View className="space-y-2">
              <Text className="text-white/60 text-xs font-bbh">Pending targeted invites</Text>
              {invites
                .filter((inv) => (inv.inviteeUsername || inv.inviteeEmail) && !inv.isExpired)
                .map((inv) => (
                  <View
                    key={inv.id}
                    className="flex-row items-center gap-3 rounded-xl bg-card-light/10 px-3 py-2"
                  >
                    <RiUserLine size={14} className="text-white/50 shrink-0" />
                    <Text className="flex-1 text-white/70 text-xs font-bbh">
                      @{inv.inviteeUsername || inv.inviteeEmail}
                    </Text>
                    <Text className="text-white/40 text-[11px] font-bbh mr-1">
                      {inv.uses}/{inv.maxUses === -1 ? '∞' : inv.maxUses} uses
                    </Text>
                    <Pressable
                      onPress={() => handleRevoke(inv.id)}
                      className="p-1 rounded-full bg-card-light/20"
                    >
                      <RiDeleteBinLine size={12} className="text-danger-400" />
                    </Pressable>
                  </View>
                ))}
            </View>
          )}
        </View>
      ) : (
        <View className="space-y-4">
          <Text className="text-white/60 text-sm font-bbh">
            Invite someone by their username. They'll receive a notification with the invite code.
          </Text>
          <Input
            placeholder="@username"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value)
            }}
            autoCapitalize="none"
            className='bg-card-lighter/10 border-0'
            //autoCorrect={false}
          />
          <Button
            label="Send invite"
            variant="default"
            fullWidth
            onClick={handleInviteByUsername}
            loading={isCreating}
            disabled={isCreating || !usernameInput.trim()}
            textClassName="text-sm"
          />
        </View>
      )}
    </View>
  )
}
