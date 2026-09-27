import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import {
  RiAlarmLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiLogoutBoxRLine,
  RiMailLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiVipCrownLine,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Switch } from '@/components/common/switch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import type { DeviceAlarmStatus } from '@/plugins/capacitor/plugins/device-alarm.plugin'
import { authAPI } from '@/shared/api/auth.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import {
  publicUrls,
  type LegalDocumentType,
} from '@/shared/config/public-urls.config'
import { getSubscriptionDisplayLabel } from '@/shared/subscription/subscription.util'
import {
  getGoalAlarmsEnabled,
  requestGoalAlarmSync,
  setGoalAlarmsEnabled,
} from '@/shared/goal/goal-alarm.service'

function getGoalAlarmDescription(
  enabled: boolean,
  status: DeviceAlarmStatus | null,
): string {
  if (!enabled) return 'Goal reminders use regular notifications'
  if (status?.permission === 'granted') {
    return `${status.scheduledCount} upcoming alarms on this device`
  }
  return 'Alarm permission is needed; push reminders stay on'
}

export default function SettingsScreen() {
  const { deleteAccount, logout, refreshSession, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const [goalAlarmsEnabled, setGoalAlarmsEnabledState] =
    useState(getGoalAlarmsEnabled)
  const [goalAlarmStatus, setGoalAlarmStatus] =
    useState<DeviceAlarmStatus | null>(null)
  const [isUpdatingGoalAlarms, setIsUpdatingGoalAlarms] = useState(false)
  const personalizationMutation = useMutation({
    mutationFn: async (enabled: boolean) =>
      authAPI.updateProfile({ rewindPersonalizationEnabled: enabled }),
    onError: (error: Error) => {
      toast.error(error.message || 'Could not update Rewind personalization')
    },
    onSuccess: async (response) => {
      if (!response.data.rewindPersonalizationEnabled) {
        queryClient.setQueryData(rewindQueryKeys.homeGreeting(), null)
      }
      await queryClient.invalidateQueries({
        queryKey: rewindQueryKeys.homeGreeting(),
      })
      await refreshSession()
      toast.success(
        response.data.rewindPersonalizationEnabled
          ? 'Rewind personalization is on'
          : 'Rewind personalization is off',
      )
    },
  })
  const proactiveChatMutation = useMutation({
    mutationFn: async (enabled: boolean) =>
      authAPI.updateProfile({ rewindProactiveChatEnabled: enabled }),
    onError: (error: Error) => {
      toast.error(error.message || 'Could not update partner messaging')
    },
    onSuccess: async (response) => {
      await refreshSession()
      toast.success(
        response.data.rewindProactiveChatEnabled
          ? 'Partners can message you'
          : 'Partner messages are paused',
      )
    },
  })
  const {
    isLoading: isSubscriptionLoading,
    isPresentingPaywall,
    isPro,
    isSupported: isSubscriptionSupported,
    openCustomerCenter,
    presentPaywall,
    status: subscriptionStatus,
  } = useSubscription()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    void requestGoalAlarmSync()
      .then(setGoalAlarmStatus)
      .catch(() => undefined)
  }, [])

  const handleGoalAlarmChange = async (enabled: boolean): Promise<void> => {
    setIsUpdatingGoalAlarms(true)
    try {
      const status = await setGoalAlarmsEnabled(enabled)
      setGoalAlarmsEnabledState(enabled)
      setGoalAlarmStatus(status)
      if (enabled && status.permission !== 'granted') {
        toast.warning(
          'Goal alarms need device permission. Push reminders stay on.',
        )
        return
      }
      toast.success(enabled ? 'Goal alarms are on' : 'Goal alarms are off')
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update goal alarms',
      )
    } finally {
      setIsUpdatingGoalAlarms(false)
    }
  }

  const goalAlarmDescription = getGoalAlarmDescription(
    goalAlarmsEnabled,
    goalAlarmStatus,
  )

  const handleSubscriptionPress = async (): Promise<void> => {
    if (isManagingSubscription || isSubscriptionLoading || isPresentingPaywall)
      return

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
            {isSubscriptionSupported ? (
              <View className="space-y-3">
                <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
                  Membership
                </Text>

                <Pressable
                  className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between disabled:opacity-60"
                  disabled={
                    isManagingSubscription ||
                    isSubscriptionLoading ||
                    isPresentingPaywall
                  }
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
                          : getSubscriptionDisplayLabel(
                              subscriptionStatus,
                              isPro,
                            )}
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightSLine size={20} className="text-white/40" />
                </Pressable>
              </View>
            ) : null}

            <View className="space-y-3">
              {Capacitor.isNativePlatform() ? (
                <View className="space-y-3">
                  <Text className="px-1 text-sm font-semibold text-card-lighter-2">
                    Reminders
                  </Text>
                  <View className="w-full flex-row items-center justify-between gap-4 rounded-2xl bg-cardx px-5 py-4">
                    <View className="flex-row min-w-0 flex-1 items-center gap-4">
                      <View className="size-10 items-center justify-center rounded-xl bg-card-light">
                        <RiAlarmLine className="text-white" size={20} />
                      </View>
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="text-sm font-semibold text-white">
                          Goal alarms
                        </Text>
                        <Text className="text-xs leading-5 text-card-lighter-2">
                          {goalAlarmDescription}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      accessibilityLabel="Use device alarms for goal reminders"
                      checked={goalAlarmsEnabled}
                      className="shrink-0"
                      disabled={isUpdatingGoalAlarms}
                      onChange={(enabled) => {
                        void handleGoalAlarmChange(enabled)
                      }}
                    />
                  </View>
                </View>
              ) : null}

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

              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2 }}
              >
                <View className="w-full flex-row items-center justify-between gap-4 rounded-2xl bg-cardx px-5 py-4">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="font-bbh text-sm font-semibold text-white">
                      Personalize Rewind
                    </Text>
                    <Text className="font-bbh text-xs leading-5 text-card-lighter-2">
                      Use my Vybaa activity to personalize Rewind
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Use my Vybaa activity to personalize Rewind"
                    checked={user?.rewindPersonalizationEnabled ?? true}
                    className="shrink-0"
                    disabled={personalizationMutation.isPending}
                    onChange={(enabled) => {
                      personalizationMutation.mutate(enabled)
                    }}
                  />
                </View>
              </motion.div>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.25 }}
              >
                <View className="w-full flex-row items-center justify-between gap-4 rounded-2xl bg-cardx px-5 py-4">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="font-bbh text-sm font-semibold text-white">
                      Partners can message me
                    </Text>
                    <Text className="font-bbh text-xs leading-5 text-card-lighter-2">
                      Let Rewind partners start a thoughtful chat during the day
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Let Rewind partners message me"
                    checked={user?.rewindProactiveChatEnabled ?? true}
                    className="shrink-0"
                    disabled={proactiveChatMutation.isPending}
                    onChange={(enabled) => {
                      proactiveChatMutation.mutate(enabled)
                    }}
                  />
                </View>
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
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.3 }}
                >
                  <Pressable
                    accessibilityLabel="Email Vybaa safety support"
                    className="bg-cardx w-full text-left rounded-2xl px-5 py-4 flex-row items-center justify-between"
                    onPress={() => {
                      window.location.href = `mailto:${publicUrls.supportEmail}?subject=Vybaa%20Safety%20Support`
                    }}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="w-10 h-10 rounded-xl bg-card-light-100 flex items-center justify-center">
                        <RiMailLine size={20} className="text-warning-yellow" />
                      </View>
                      <View>
                        <Text className="text-white text-sm font-bbh font-semibold">
                          Safety support
                        </Text>
                        <Text className="text-card-lighter-3 text-xs font-bbh">
                          {publicUrls.supportEmail}
                        </Text>
                      </View>
                    </View>
                    <RiArrowRightSLine
                      size={20}
                      className="text-card-lighter-3"
                    />
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
                  className="bg-[#250f1a] rounded-2xl px-5 py-4 flex-row w-full items-center justify-between"
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

            <View className="space-y-3 ">
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
                  className="bg-[#250f1a] rounded-2xl px-5 py-4 flex-row w-full items-center justify-between disabled:opacity-60"
                >
                  <View className="flex-row items-center text-left gap-4 w-full">
                    <View className="w-10 h-10 rounded-xl  flex items-center justify-center">
                      <RiDeleteBinLine size={26} className="text-danger-400" />
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
