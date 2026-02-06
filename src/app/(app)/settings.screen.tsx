import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotchPadd } from '@/components/common/notch.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiInformationLine,
  RiLogoutBoxRLine,
  RiNotification3Line,
  RiPaletteLine,
  RiQuestionLine,
  RiShieldLine
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export default function SettingsScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const settingsItems = [
    {
      id: 'notifications',
      icon: RiNotification3Line,
      label: 'Notifications',
      description: 'Manage alerts',
      action: () => {},
    },
    {
      id: 'appearance',
      icon: RiPaletteLine,
      label: 'Appearance',
      description: 'Theme & display',
      action: () => {},
    },
    {
      id: 'privacy',
      icon: RiShieldLine,
      label: 'Privacy',
      description: 'Data & security',
      action: () => {},
    },
    {
      id: 'about',
      icon: RiInformationLine,
      label: 'About',
      description: 'App info',
      action: () => {},
    },
    {
      id: 'help',
      icon: RiQuestionLine,
      label: 'Help & Support',
      description: 'Get assistance',
      action: () => {},
    },
  ]

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      <NoiseComponent>
      {/* Header */}
      <TopNotchPadd />
      <View className="flex-row items-center justify-between px-mg py-4">
        <Pressable
          onPress={() => navigate({ to: '/app/profile' })}
          className="w-12 h-12 rounded-full bg-card-light/40 flex items-center justify-center"
        >
          <RiArrowLeftSLine size={24} className="text-white" />
        </Pressable>
        <Text className="text-white text-xl font-bbh font-bold">Settings</Text>
        <View className="w-12" />
      </View>

      <View className="flex-1 px-mg pb-[120px] pt-4 space-y-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <View className="bg-card-light/40 rounded-2xl p-5 flex-row items-center gap-4">
            <View className="rounded-full w-16 h-16 bg-card-light/60 flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text className="text-white text-xl font-bbh font-bold">
                  {user?.email[0].toUpperCase()}
                </Text>
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-lg font-bbh font-bold">
                {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || user?.email}
              </Text>
              <Text className="text-white/50 text-sm font-bbh truncate">
                {user?.email}
              </Text>
            </View>
          </View>
        </motion.div>

        {/* App Settings Section */}
        <View className="space-y-3">
          <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
            App Settings
          </Text>
          
          <View className="space-y-2 w-full">
            {settingsItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className='w-full'
              >
                <Pressable
                  onPress={item.action}
                  className="bg-card-light/40 w-full  text-left rounded-2xl px-5 py-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                      <item.icon size={20} className="text-white" />
                    </View>
                    <View>
                      <Text className="text-white text-sm font-bbh font-semibold">
                        {item.label}
                      </Text>
                      <Text className="text-white/50 text-xs font-bbh">
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightSLine size={20} className="text-white/40" />
                </Pressable>
              </motion.div>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
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
              onPress={()=> {
                if(confirm("Do you really want to logout?")) {
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
      </View>
      </NoiseComponent>
    </View>
  )
}
