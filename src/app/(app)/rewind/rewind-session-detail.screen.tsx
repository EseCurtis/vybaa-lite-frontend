import { RiLockLine, RiRefreshLine } from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import {
  MissedRewindStatus,
  ReflectionProcessingStatus,
} from '@/components/custom/rewind/reflection-status.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewindSession } from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import { colors } from '@/shared/colors.shared'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'

import { RewindSessionDetail } from './history/rewind-session-detail-sheet.component'

export type RewindSessionDetailOrigin = 'history' | 'insights' | 'rewind'

export default function RewindSessionDetailScreen({
  origin,
}: {
  origin: RewindSessionDetailOrigin
}): ReactElement {
  const router = useRouter()
  const { user } = useAuth()
  const { sessionId } = useParams({ from: '/app/r/$sessionId' })
  const {
    data: session,
    error,
    isError,
    isLoading,
    refetch,
  } = useRewindSession(sessionId)
  const persona = session ? getRewindPersona(session.personaId) : null
  const loadingPersona =
    persona ??
    REWIND_PERSONAS.find((partner) => partner.id === user?.rewindPersona) ??
    getRewindPersona('ella')
  const returnPath =
    origin === 'history'
      ? '/app/rewind-history-sessions'
      : origin === 'rewind'
        ? '/app/rewind'
        : '/app/rewind-history'

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => {
            void navigateBackWithinApp(
              router,
              `/app/r/${sessionId}`,
              returnPath,
            )
          }}
          title={persona?.name ?? 'Rewind'}
        />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px]">
          <View className="mx-auto w-full max-w-3xl">
            {isLoading ? (
              <ReflectionProcessingStatus
                partnerId={loadingPersona.id}
                message="Opening your reflection…"
              />
            ) : isError && !session ? (
              <View
                className="gap-4 rounded-[24px] px-4 py-5"
                style={{ backgroundColor: colors['card-light-50'] }}
              >
                <Text
                  className="font-bbh text-base font-bold"
                  style={{ color: colors.white }}
                >
                  Could not open this Rewind
                </Text>
                <Text
                  className="font-bbh text-sm leading-6"
                  style={{ color: colors['card-lighter-2'] }}
                >
                  {error instanceof Error
                    ? error.message
                    : 'Try refreshing the session.'}
                </Text>
                <Button
                  label="Retry"
                  leftIcon={<RiRefreshLine size={18} />}
                  onClick={() => {
                    void refetch()
                  }}
                  variant="secondary"
                />
              </View>
            ) : session?.status === 'SCHEDULED' ? (
              <View className="items-center gap-3 px-4 py-10" role="status">
                <RiLockLine size={24} className="text-card-lighter-2" />
                <Text className="font-bbh text-base font-semibold text-white">
                  Scheduled Rewind
                </Text>
                <Text className="text-center font-bbh text-sm text-card-lighter-2">
                  Your reflection will be available after this Rewind starts.
                </Text>
              </View>
            ) : session?.status === 'MISSED' ? (
              <MissedRewindStatus partnerId={session.personaId} />
            ) : session?.status === 'FINALIZING' ? (
              <ReflectionProcessingStatus partnerId={session.personaId} />
            ) : session ? (
              <RewindSessionDetail session={session} />
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
