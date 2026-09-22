import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PersonaArtwork, PersonaThumbnail } from '@/app/(app)/rewind.screen'
import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch, TopNotch } from '@/components/common/notch.component'
import { ProFeatureGateSheet } from '@/components/custom/subscription/pro-feature-gate.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { hapticFeedback } from '@/shared/haptic.util'
import {
  markOnboardingSkipped,
  markRewindPartnerOnboardingSeen,
} from '@/shared/permissions/permission-onboarding.util'
import {
  getRewindPersona,
  isFreeRewindPersona,
  REWIND_PERSONAS,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import { getApiErrorMessage } from '@/shared/utils/api-error.util'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'

export default function RewindPartnerOnboardingScreen() {
  const router = useRouter()
  const toast = useToast()
  const bottomSheet = useBottomSheetController()
  const { isPro } = useSubscription()
  const { refreshSession, user } = useAuth()
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<RewindPersonaId>('ella')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    markRewindPartnerOnboardingSeen(user.id)
    if (!user.rewindPersona) return

    setSelectedPersonaId(user.rewindPersona)
    void navigateAfterAuth(router, user).catch((error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Could not open Vybaa. Try again.'))
    })
  }, [router, toast, user])

  async function handleSkip(): Promise<void> {
    if (!user) return
    markOnboardingSkipped(user.id)
    await hapticFeedback.light()
    await navigateAfterAuth(router, user)
  }

  async function handleBack(): Promise<void> {
    await hapticFeedback.light()
    await router.navigate({ replace: true, to: '/app/permissions' })
  }

  async function handleContinue(): Promise<void> {
    if (isSaving || !user) return

    setIsSaving(true)
    setSaveError(null)
    await hapticFeedback.light()

    try {
      let updatedUser = user
      if (user.rewindPersona !== selectedPersonaId) {
        const response = await authAPI.updateProfile({
          rewindPersona: selectedPersonaId,
        })
        updatedUser = response.data
        try {
          await refreshSession()
        } catch {
          toast.info('Partner saved. Your account will refresh shortly.')
        }
      }
      markRewindPartnerOnboardingSeen(user.id)
      await navigateAfterAuth(router, updatedUser)
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Could not save your Rewind partner. Check your connection and try again.',
      )
      setSaveError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (user?.rewindPersona) {
    return <AppLoadingState message="Opening your Rewind partner..." />
  }

  return (
    <View className="relative min-h-dvh flex-1 overflow-hidden bg-cardd text-white">
      <NoiseComponent>
        <header className="fixed inset-x-0 top-0 z-30 ">
          <TopNotch />
          <View className="mx-auto h-14 w-full max-w-xl flex-row items-center justify-between px-5">
            <Text className="text-lg font-bold text-white">Rewind</Text>
            <Pressable
              accessibilityLabel="Skip Rewind partner setup"
              className="min-h-11 min-w-11 items-center justify-center px-2"
              disabled={isSaving}
              onPress={() => void handleSkip()}
            >
              <Text className="text-sm font-bold text-white">Skip</Text>
            </Pressable>
          </View>
        </header>

        <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto px-5 pb-5 pt-[calc(var(--safe-area-inset-top)+50px)]">
          <View className="gap-2 pt-5">
            <Text className="text-[29px] font-black leading-9 text-white">
              Choose your Rewind partner.
            </Text>
            <Text className="max-w-md text-sm leading-6 text-card-lighter-2">
              Pick the voice you want in your corner. You can change them later
              in Rewind.
            </Text>
            {!isPro ? (
              <Text className="max-w-md text-xs leading-5 text-card-lighter-3">
                Ella and Lyra are included free. The full partner team comes
                with Vybaa Pro.
              </Text>
            ) : null}
          </View>

          <View className="mt-6 gap-5">
            <PersonaArtwork
              persona={getRewindPersona(selectedPersonaId)}
              onChoose={() => void handleContinue()}
              showAction={false}
            />
            <View className="grid grid-cols-6 gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
              {REWIND_PERSONAS.map((persona) => (
                <PersonaThumbnail
                  key={persona.id}
                  persona={persona}
                  selected={selectedPersonaId === persona.id}
                  onSelect={(id) => {
                    if (!isPro && !isFreeRewindPersona(id)) {
                      bottomSheet.present(
                        <ProFeatureGateSheet
                          feature="rewind-partners"
                          onUnlocked={() => setSelectedPersonaId(id)}
                        />,
                        { size: 'semi-full', title: 'More Rewind partners' },
                      )
                      return
                    }
                    setSaveError(null)
                    setSelectedPersonaId(id)
                    if (selectedPersonaId !== id) {
                      void hapticFeedback.selection()
                    }
                  }}
                  disabled={isSaving}
                  locked={!isPro && !isFreeRewindPersona(persona.id)}
                />
              ))}
            </View>
          </View>

          <BottomNotch />
        </main>
      </NoiseComponent>

      <View className="mt-auto gap-3 pt-1 z-10 px-mg">
        {saveError ? (
          <Text
            aria-live="assertive"
            className="rounded-xl bg-danger-900 px-4 py-3 text-center text-xs leading-5 text-danger-100"
            role="alert"
          >
            {saveError}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-3  mt-4 w-full justify-between">
          <Button
            aria-label="Back"
            className=" bg-cardd"
            disabled={isSaving}
            label="Back"
            onClick={() => void handleBack()}
            variant="secondary"
          />

          <Text className="text-center text-xs font-bold text-card-lighter-3">
            2 / 2
          </Text>
          <Button
            aria-label={`Continue with ${getRewindPersona(selectedPersonaId).name}`}
            className=" bg-white"
            disabled={isSaving}
            label="Finish"
            loading={isSaving}
            onClick={() => void handleContinue()}
          />
        </View>

        <BottomNotch />
      </View>
    </View>
  )
}
