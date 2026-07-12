import { RiRefreshLine } from '@remixicon/react'
import { useNavigate, useParams } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewindSession } from '@/hooks/use-rewind.hook'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

import { RewindSessionDetail } from './history/rewind-session-detail-sheet.component'

export default function RewindSessionDetailScreen(): ReactElement {
  const navigate = useNavigate()
  const { sessionId } = useParams({ from: '/app/r/$sessionId' })
  const { data: session, error, isError, isLoading, refetch } =
    useRewindSession(sessionId)
  const persona = session ? getRewindPersona(session.personaId) : null

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => navigate({ replace: true, to: '/app/rewind-history' })}
          title={persona?.name ?? 'Rewind'}
        />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px]">
          <View className="mx-auto w-full max-w-3xl">
            {isLoading ? (
              <View className="items-center justify-center gap-3 py-16">
                <Spinner  />
                <Text
                  className="font-bbh text-sm"
                  style={{ color: colors['card-lighter-2'] }}
                >
                  Loading Rewind...
                </Text>
              </View>
            ) : isError ? (
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
            ) : session ? (
              <RewindSessionDetail session={session} />
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
