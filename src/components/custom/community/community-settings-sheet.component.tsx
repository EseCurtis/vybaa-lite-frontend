import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCommunityMembers,
  useDeleteCommunity,
  useLeaveCommunity,
  useUpdateCommunity,
  useUpdateMemberRole,
} from '@/hooks/use-communities.hook'
import type { Community } from '@/shared/api/community.api'
import { RiDeleteBinLine, RiEdit2Line, RiLogoutBoxLine, RiMessage3Line, RiUserStarLine } from '@remixicon/react'
import { useState } from 'react'

interface CommunitySettingsSheetProps {
  community: Community
  onClose: () => void
  onDeleted?: () => void
}

export function CommunitySettingsSheet({
  community,
  onClose,
  onDeleted,
}: CommunitySettingsSheetProps) {
  const isOwner = community.userRole === 'OWNER'
  const isMember = community.isMember

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description || '')

  const { mutateAsync: updateCommunity, isPending: isUpdating } = useUpdateCommunity()
  const { mutateAsync: deleteCommunity, isPending: isDeleting } = useDeleteCommunity()
  const { mutateAsync: leaveCommunity, isPending: isLeaving } = useLeaveCommunity()
  const { data: membersData } = useCommunityMembers(community.id, 1, 20)
  const { mutateAsync: updateMemberRole } = useUpdateMemberRole()

  const members = membersData?.data || []

  const handleSave = async () => {
    await updateCommunity({
      communityId: community.id,
      data: {
        name: name.trim() || community.name,
        description: description.trim() || undefined,
      },
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this community and all its data? This cannot be undone.')) return
    await deleteCommunity(community.id)
    onDeleted?.()
    onClose()
  }

  const handleLeave = async () => {
    if (!confirm('Leave this community?')) return
    await leaveCommunity(community.id)
    onClose()
  }

  const canManageMembers = isOwner || community.userRole === 'MOD'

  return (
    <View className="space-y-5">
      {/* General settings */}
      <View className="space-y-3">
        <Text className="text-white/80 text-sm font-bbh">Community</Text>
        <View className="rounded-2xl bg-card-light/10 p-3 space-y-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-sm font-bbh">{community.name}</Text>
            {isOwner && (
              <Pressable
                onPress={() => setIsEditing(true)}
                className="px-2 py-1 rounded-full bg-card-light/20 flex-row items-center gap-1"
              >
                <RiEdit2Line size={14} className="text-white/70" />
                <Text className="text-white/80 text-[11px] font-bbh">Edit</Text>
              </Pressable>
            )}
          </View>
          {community.description && (
            <Text className="text-white/60 text-xs font-bbh">
              {community.description}
            </Text>
          )}
        </View>

        {isEditing && (
          <View className="mt-1 space-y-2">
            <input
              className="w-full rounded-xl bg-card-light/20 px-3 py-2 text-sm text-white font-bbh outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Community name"
            />
            <textarea
              className="w-full rounded-xl bg-card-light/20 px-3 py-2 text-sm text-white font-bbh outline-none min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              maxLength={500}
            />
            <View className="flex-row justify-end gap-2">
              <Button
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setName(community.name)
                  setDescription(community.description || '')
                }}
                textClassName="text-xs"
              />
              <Button
                label="Save"
                variant="default"
                size="sm"
                onClick={handleSave}
                loading={isUpdating}
                disabled={isUpdating}
                textClassName="text-xs"
              />
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="space-y-2">
        <Text className="text-white/80 text-sm font-bbh">Actions</Text>
        <View className="space-y-2">
          {/* Send message – placeholder hook to future chat/inbox */}
          <Pressable
            onPress={() => {
              // TODO: wire to community chat / broadcast
              alert('Send message to community (to be implemented)')
            }}
            className="rounded-2xl bg-card-light/15 px-3 py-2 flex-row items-center gap-2"
          >
            <RiMessage3Line size={16} className="text-white/70" />
            <Text className="text-white/80 text-xs font-bbh">
              Send message to community
            </Text>
          </Pressable>

          {isOwner ? (
            <>
              <Pressable
                onPress={handleDelete}
                className="rounded-2xl bg-danger-500/15 border border-danger-500/40 px-3 py-2 flex-row items-center gap-2"
              >
                <RiDeleteBinLine size={16} className="text-danger-400" />
                <Text className="text-danger-400 text-xs font-bbh">
                  Delete community
                </Text>
              </Pressable>
            </>
          ) : isMember ? (
              <Pressable
              onPress={handleLeave}
                className="rounded-2xl bg-card-light/15 px-3 py-2 flex-row items-center gap-2"
            >
              <RiLogoutBoxLine size={16} className="text-white/70" />
              <Text className="text-white/80 text-xs font-bbh">
                Leave community
              </Text>
            </Pressable>
          ) : null}

          {/* Invite/suggest can be added here later */}
        </View>
      </View>
    </View>
  )
}

