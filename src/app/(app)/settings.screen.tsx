import { Browser } from '@capacitor/browser'
import {
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiLogoutBoxRLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiVipCrownLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import {
  publicUrls,
  type LegalDocumentType,
} from '@/shared/config/public-urls.config'
import { getSubscriptionDisplayLabel } from '@/shared/subscription/subscription.util'

export default function SettingsScreen() {
  const { logout, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const {
    isLoading: isSubscriptionLoading,
    isPro,
    openCustomerCenter,
    presentPaywall,
    status: subscriptionStatus,
  } = useSubscription()

  const handleSubscriptionPress = async (): Promise<void> => {
    if (isManagingSubscription || isSubscriptionLoading) return

    try {
      setIsManagingSubscription(true)
      if (isPro) {
        await openCustomerCenter()
        return
      }

      const outcome = await presentPaywall()
      if (outcome === 'purchased' || outcome === 'restored') {
        toast.success('Vybaa Pro is ready')
      } else if (outcome === 'pending') {
        toast.info('Your purchase is pending approval.')
      } else if (outcome === 'error') {
        toast.error('The subscription screen could not complete your purchase.')
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Subscriptions are unavailable right now.',
      )
    } finally {
      setIsManagingSubscription(false)
    }
  }

  const openLegalDocument = async (documentType: LegalDocumentType) => {
    const url =
      documentType === 'terms'
        ? publicUrls.termsOfService
        : publicUrls.privacyPolicy

    try {
      await Browser.open({ presentationStyle: 'fullscreen', url })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to open legal page'
      toast.error(message)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Delete your account permanently? This will remove your profile, goals, journals, achievements, communities, wallet history, and settings. This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    const typedConfirmation = prompt(
      'Type DELETE to permanently delete your account.',
    )

    if (typedConfirmation !== 'DELETE') {
      toast.error('Account deletion cancelled')
      return
    }

    try {
      setIsDeletingAccount(true)
      await deleteAccount()
      toast.success('Account deleted')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete account'
      toast.error(message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <View className="flex-1 bg-cardd ">
      <NoiseComponent>
        {/* Header */}
        <TabHeader title="Settings" />

        <View className="overflow-y-auto no-scrollbar flex-1">
          <View className=" px-mg pb-[120px] space-y-6">
            <View className="space-y-3">
              <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
                Membership
              </Text>

              <Pressable
                className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between disabled:opacity-60"
                disabled={isManagingSubscription || isSubscriptionLoading}
                onPress={() => {
                  void handleSubscriptionPress()
                }}
              >
                <View className="flex-row items-center gap-4 flex-1 min-w-0">
                  <View className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                    <RiVipCrownLine size={20} className="text-accent-300" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-white text-sm font-bbh font-semibold">
                      Vybaa Pro
                    </Text>
                    <Text className="text-white/50 text-xs font-bbh">
                      {isSubscriptionLoading
                        ? 'Checking subscription...'
                        : getSubscriptionDisplayLabel(subscriptionStatus)}
                    </Text>
                  </View>
                </View>
                <RiArrowRightSLine size={20} className="text-white/40" />
              </Pressable>
            </View>

            <View className="space-y-3">
              <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
                Rewind
              </Text>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Pressable
                  onPress={() => {
                    void navigate({
                      search: { from: 'settings' },
                      to: '/app/rewind-routine',
                    })
                  }}
                  className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-4 flex-1 min-w-0">
                    <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                      <RiTimeLine size={20} className="text-white" />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-white text-sm font-bbh font-semibold">
                        Rewind routine
                      </Text>
                      <Text className="text-white/50 text-xs font-bbh">
                        Choose your reflection times and focus
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightSLine size={20} className="text-white/40" />
                </Pressable>
              </motion.div>
            </View>

            {/* Legal Section */}
            <View className="space-y-3">
              <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
                Legal
              </Text>

              <View className="space-y-2 w-full">
                {/* Terms of Service */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full"
                >
                  <Pressable
                    onPress={() => {
                      void openLegalDocument('terms')
                    }}
                    className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                        <RiFileTextLine size={20} className="text-white" />
                      </View>
                      <View>
                        <Text className="text-white text-sm font-bbh font-semibold">
                          Terms of Service
                        </Text>
                        <Text className="text-white/50 text-xs font-bbh">
                          Read our terms and conditions
                        </Text>
                      </View>
                    </View>
                    <RiArrowRightSLine size={20} className="text-white/40" />
                  </Pressable>
                </motion.div>

                {/* Privacy Policy */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="w-full"
                >
                  <Pressable
                    onPress={() => {
                      void openLegalDocument('privacy')
                    }}
                    className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                        <RiShieldCheckLine size={20} className="text-white" />
                      </View>
                      <View>
                        <Text className="text-white text-sm font-bbh font-semibold">
                          Privacy Policy
                        </Text>
                        <Text className="text-white/50 text-xs font-bbh">
                          How we protect your data
                        </Text>
                      </View>
                    </View>
                    <RiArrowRightSLine size={20} className="text-white/40" />
                  </Pressable>
                </motion.div>
              </View>
            </View>

            {/* Account Section */}
            <View className="space-y-3">
              <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
                Account
              </Text>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Pressable
                  onPress={() => {
                    if (confirm('Do you really want to logout?')) {
                      logout()
                    }
                  }}
                  className="bg-pink-900/30 rounded-2xl px-5 py-4 flex-row w-full items-center justify-between"
                >
                  <View className="flex-row items-center text-left gap-4  w-full">
                    <View className="w-10 h-10 rounded-xl  flex items-center justify-center">
                      <RiLogoutBoxRLine size={20} className="text-pink-500" />
                    </View>
                    <View>
                      <Text className="text-white text-sm font-bbh font-semibold">
                        Logout
                      </Text>
                      <Text className="text-white/50 text-xs font-bbh">
                        Sign out of your account
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightSLine size={20} className="text-white/40" />
                </Pressable>
              </motion.div>
            </View>

            <View className="space-y-3">
              <Text className="text-danger-400 text-sm font-bbh font-semibold px-1">
                Danger Zone
              </Text>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-danger-500/15  rounded-2xl px-5 py-4 flex-row w-full items-center justify-between disabled:opacity-60"
                >
                  <View className="flex-row items-center text-left gap-4 w-full">
                    <View className="w-10 h-10 rounded-xl bg-danger-500/15 flex items-center justify-center">
                      <RiDeleteBinLine size={20} className="text-danger-400" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-danger-400 text-sm font-bbh font-semibold">
                        {isDeletingAccount
                          ? 'Deleting account...'
                          : 'Delete account'}
                      </Text>
                      <Text className="text-white/50 text-xs font-bbh">
                        Permanently remove your account and data
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightSLine size={20} className="text-danger-400/70" />
                </Pressable>
              </motion.div>
            </View>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
