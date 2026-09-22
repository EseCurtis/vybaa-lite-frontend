import { Browser } from '@capacitor/browser'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import { getPublicProfileUrl } from '@/shared/config/public-urls.config'
import { RiExternalLinkLine, RiFileCopyLine, RiLinkM } from '@remixicon/react'

interface PublicProfileLinkProps {
  onChooseUsername: () => void
  username: string | null | undefined
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('Copy is not supported in this browser')
  }
}

export function PublicProfileLink({
  onChooseUsername,
  username,
}: PublicProfileLinkProps) {
  const toast = useToast()
  const publicProfileUrl = username ? getPublicProfileUrl(username) : null

  async function copyPublicProfileUrl(): Promise<void> {
    if (!publicProfileUrl) {
      onChooseUsername()
      return
    }

    try {
      await copyText(publicProfileUrl)
      toast.success('Public profile link copied')
    } catch {
      toast.error('Could not copy your public profile link')
    }
  }

  async function viewPublicProfile(): Promise<void> {
    if (!publicProfileUrl) {
      onChooseUsername()
      return
    }

    try {
      await Browser.open({
        presentationStyle: 'fullscreen',
        url: publicProfileUrl,
      })
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not open your public profile',
      )
    }
  }

  return (
    <View className="rounded-2xl bg-cardd border border-cardx p-3">
      {publicProfileUrl ? (
        <View className="flex-row items-center gap-3">
          <View className="size-10 rounded-xl bg-card-light-50 items-center justify-center shrink-0">
            <RiLinkM size={19} className="text-card-lighter-2" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-white text-sm font-bbh font-bold">
              Share your progress
            </Text>
            <Text
              className="text-card-lighter-2 text-xs font-bbh mt-0.5"
              lines={1}
            >
              {publicProfileUrl.replace('https://', '')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Copy public profile link"
            className="size-11 rounded-full bg-card-light-50 items-center justify-center shrink-0"
            onPress={() => void copyPublicProfileUrl()}
          >
            <RiFileCopyLine size={18} className="text-white" />
          </Pressable>
          <Pressable
            accessibilityLabel="View public profile"
            className="size-11 rounded-full bg-white items-center justify-center shrink-0"
            onPress={() => void viewPublicProfile()}
          >
            <RiExternalLinkLine size={18} className="text-black" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Choose a public profile username"
          className="min-h-11 flex-row items-center gap-3"
          onPress={onChooseUsername}
        >
          <View className="size-10 rounded-xl bg-card-light-50 items-center justify-center shrink-0">
            <RiLinkM size={19} className="text-card-lighter-2" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-bbh font-bold">
              Claim your public profile
            </Text>
            <Text className="text-card-lighter-2 text-xs font-bbh mt-0.5">
              Choose a username for your Vybaa URL
            </Text>
          </View>
          <RiExternalLinkLine size={18} className="text-card-lighter-2" />
        </Pressable>
      )}
    </View>
  )
}
