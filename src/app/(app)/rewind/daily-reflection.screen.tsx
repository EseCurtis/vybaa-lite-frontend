import { useRouter } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ReflectionProcessingStatus } from '@/components/custom/rewind/reflection-status.component'
import { Button } from '@/components/layout/button.component'
import { View } from '@/components/layout/view.component'
import { useDailyReflection } from '@/hooks/use-reflection-days.hook'
import { useAuth } from '@/providers/auth.provider'
import { isReflectionDayKey } from '@/shared/api/reflections.api'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'

import { DailyReflectionContent } from './history/daily-reflection-row.component'

export default function DailyReflectionScreen({
  dayKey,
}: {
  dayKey: string
}): ReactElement {
  const router = useRouter()
  const { user } = useAuth()
  const query = useDailyReflection(dayKey)
  const reflection = query.data
  const partner =
    REWIND_PERSONAS.find((persona) => persona.id === user?.rewindPersona) ??
    REWIND_PERSONAS.find(
      (persona) => persona.id === reflection?.participantIds[0],
    ) ??
    getRewindPersona('ella')
  const valid = isReflectionDayKey(dayKey)
  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader
          canGoBack
          title={
            <span className="block max-w-[180px] whitespace-normal text-center text-base leading-5">
              Reflections n’ summary
            </span>
          }
          onBack={() => {
            void navigateBackWithinApp(
              router,
              `/app/reflections/${dayKey}`,
              '/app/rewind-history-sessions',
            )
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-mg pb-[120px]">
          <div className="mx-auto w-full max-w-3xl">
            {!valid ? (
              <p
                role="alert"
                className="py-8 font-bbh text-sm text-card-lighter-2"
              >
                This reflection date isn’t valid.
              </p>
            ) : null}
            {valid && query.isPending ? (
              <ReflectionProcessingStatus
                partnerId={partner.id}
                message="Opening your reflection…"
              />
            ) : null}
            {query.isError ? (
              <div role="alert" className="flex flex-col gap-4 py-6 font-bbh">
                <p className="text-sm text-card-lighter-2">
                  {reflection
                    ? 'Couldn’t refresh this reflection. Your saved summary is kept.'
                    : 'Couldn’t open this reflection.'}
                </p>
                <Button
                  label="Retry"
                  variant="secondary"
                  onClick={() => {
                    void query.refetch()
                  }}
                />
              </div>
            ) : null}
            {reflection?.processing ? (
              <ReflectionProcessingStatus partnerId={partner.id} />
            ) : null}
            {reflection &&
            !reflection.processing &&
            reflection.state === 'COLLECTING' &&
            !reflection.analyzedAt ? (
              <ReflectionProcessingStatus
                partnerId={partner.id}
                message="Your summary is queued"
              />
            ) : null}
            {reflection &&
            (reflection.analyzedAt || reflection.state !== 'COLLECTING') ? (
              <DailyReflectionContent
                reflection={reflection}
                user={user ?? undefined}
              />
            ) : null}
          </div>
        </div>
      </NoiseComponent>
    </View>
  )
}
