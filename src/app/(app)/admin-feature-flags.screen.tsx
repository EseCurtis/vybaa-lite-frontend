import { Input } from '@/components/common/input.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import {
  adminAPI,
  type FeatureFlag,
  type ModerationReport,
} from '@/shared/api/admin.api'
import { getApiErrorMessage } from '@/shared/utils/api-error.util'
import { cn } from '@/shared/utils/helpers.util'
import {
  RiAlarmWarningLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiToggleFill,
} from '@remixicon/react'
import { useEffect, useState } from 'react'

export default function AdminFeatureFlagsScreen() {
  const toast = useToast()
  const [secret, setSecret] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [flags, setFlags] = useState<FeatureFlag[] | null>(null)
  const [loadingFlags, setLoadingFlags] = useState(false)
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)

  const loadFlags = async (currentSecret: string) => {
    setLoadingFlags(true)
    try {
      const [flagResponse, openReports, reviewingReports] = await Promise.all([
        adminAPI.listFeatureFlags(currentSecret),
        adminAPI.listModerationReports(currentSecret, 'OPEN'),
        adminAPI.listModerationReports(currentSecret, 'REVIEWING'),
      ])
      setFlags(flagResponse.data)
      setReports([...openReports.data, ...reviewingReports.data])
      setIsAuthed(true)
    } catch (error: unknown) {
      setIsAuthed(false)
      setFlags(null)
      toast.error(getApiErrorMessage(error, 'Invalid admin secret'))
    } finally {
      setLoadingFlags(false)
    }
  }

  const handleSubmitSecret = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secret.trim()) return
    setIsAuthenticating(true)
    await loadFlags(secret.trim())
    setIsAuthenticating(false)
  }

  const handleToggle = async (flagKey: string, enabled: boolean) => {
    if (!secret.trim()) return
    try {
      const res = await adminAPI.upsertFeatureFlag(secret.trim(), {
        key: flagKey,
        enabled,
      })
      setFlags((prev) =>
        prev ? prev.map((f) => (f.key === flagKey ? res.data : f)) : [res.data],
      )
      toast.success('Feature flag updated')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to update flag'))
    }
  }

  async function updateReport(
    report: ModerationReport,
    status: 'DISMISSED' | 'RESOLVED' | 'REVIEWING',
  ): Promise<void> {
    if (!secret.trim() || updatingReportId) return
    if (
      status === 'RESOLVED' &&
      !window.confirm(
        `Remove the reported content and suspend @${report.targetUser.username || report.targetUser.firstName || 'user'}?`,
      )
    ) {
      return
    }
    setUpdatingReportId(report.id)
    try {
      await adminAPI.updateModerationReport(secret.trim(), report.id, {
        action:
          status === 'RESOLVED' ? 'REMOVE_CONTENT_AND_SUSPEND' : undefined,
        status,
      })
      setReports((current) => current.filter((item) => item.id !== report.id))
      toast.success(
        status === 'RESOLVED'
          ? 'Content removed and user suspended'
          : 'Report updated',
      )
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not update report'))
    } finally {
      setUpdatingReportId(null)
    }
  }

  // Ensure REAL_WALLET appears even if not yet created
  useEffect(() => {
    if (!flags || !isAuthed) return
    if (!flags.find((f) => f.key === 'REAL_WALLET')) {
      setFlags([
        ...flags,
        {
          id: 'virtual-REAL_WALLET',
          key: 'REAL_WALLET',
          enabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    }
  }, [flags, isAuthed])

  const realWalletFlag = flags?.find((f) => f.key === 'REAL_WALLET')

  return (
    <View className="flex-1 bg-cardd overflow-y-auto">
      <NoiseComponent>
        <TabHeader title="Admin · Feature Flags" canGoBack>
          {/* no actions */}
        </TabHeader>

        <View className="px-mg py-4 space-y-6">
          <form
            onSubmit={handleSubmitSecret}
            className="flex flex-col gap-3 rounded-2xl bg-card-light/10 p-4"
          >
            <Text className="text-white/80 text-sm font-bbh">
              Admin Secret Phrase
            </Text>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin secret"
            />
            <Button
              type="submit"
              label={isAuthed ? 'Re-authenticate' : 'Authenticate'}
              size="sm"
              loading={isAuthenticating}
              disabled={isAuthenticating || !secret.trim()}
              className="w-fit mt-1"
            />
          </form>

          {isAuthed && (
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white/70 text-sm font-bbh">
                  Feature Flags
                </Text>
                {loadingFlags && (
                  <View className="flex-row items-center gap-1">
                    <Spinner size={34} />
                    <Text className="text-white/50 text-xs font-bbh">
                      Loading…
                    </Text>
                  </View>
                )}
              </View>

              <View className="space-y-3">
                <View className="rounded-2xl bg-card-light/10 p-4 flex-row items-center justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bbh font-semibold">
                      REAL_WALLET
                    </Text>
                    <Text className="text-white/50 text-xs font-bbh mt-1">
                      Enables the Main Wallet (real points). Keep off in
                      production until ready.
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      handleToggle('REAL_WALLET', !realWalletFlag?.enabled)
                    }
                    className={cn(
                      'flex-row items-center gap-2 px-3 py-2 rounded-full border border-card-light/40',
                      realWalletFlag?.enabled
                        ? 'bg-emerald-500/20 border-emerald-400/60'
                        : 'bg-card-light/10',
                    )}
                  >
                    {realWalletFlag?.enabled && (
                      <RiCheckLine size={14} className="text-emerald-400" />
                    )}
                    <Text className="text-xs font-bbh text-white">
                      {realWalletFlag?.enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                    <RiToggleFill
                      size={18}
                      className={cn(
                        'text-white/40',
                        realWalletFlag?.enabled && 'text-emerald-400',
                      )}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {isAuthed ? (
            <View className="space-y-3">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-sm font-semibold text-white font-bbh">
                  Safety queue
                </Text>
                <Text className="text-xs text-card-lighter-3 font-bbh">
                  {reports.length} pending
                </Text>
              </View>
              {reports.length ? (
                [...reports]
                  .sort(
                    (first, second) =>
                      new Date(first.createdAt).getTime() -
                      new Date(second.createdAt).getTime(),
                  )
                  .map((report) => (
                    <View
                      key={report.id}
                      className="rounded-2xl bg-card-light-50 p-4"
                    >
                      <View className="flex-row items-start gap-3">
                        <View
                          className={`size-10 items-center justify-center rounded-xl ${report.isOverdue ? 'bg-danger-900' : 'bg-warning-900'}`}
                        >
                          <RiAlarmWarningLine
                            className={
                              report.isOverdue
                                ? 'text-danger-300'
                                : 'text-warning-300'
                            }
                            size={20}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white font-bbh">
                            {report.reason} · @
                            {report.targetUser.username || 'user'}
                          </Text>
                          <Text className="mt-1 text-xs text-card-lighter-3 font-bbh">
                            {report.isOverdue ? 'Overdue' : 'Due'}{' '}
                            {new Date(report.responseDueAt).toLocaleString()}
                          </Text>
                          {report.details ? (
                            <Text className="mt-2 text-xs leading-5 text-card-lighter-3 font-bbh">
                              {report.details}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {report.status === 'OPEN' ? (
                          <Button
                            disabled={updatingReportId === report.id}
                            label="Start review"
                            onClick={() =>
                              void updateReport(report, 'REVIEWING')
                            }
                            size="sm"
                            variant="secondary"
                          />
                        ) : null}
                        <Button
                          disabled={updatingReportId === report.id}
                          label="Remove + suspend"
                          leftIcon={<RiDeleteBinLine size={15} />}
                          onClick={() => void updateReport(report, 'RESOLVED')}
                          size="sm"
                          variant="destructive"
                        />
                        <Button
                          disabled={updatingReportId === report.id}
                          label="Dismiss"
                          onClick={() => void updateReport(report, 'DISMISSED')}
                          size="sm"
                          variant="ghost"
                        />
                      </View>
                    </View>
                  ))
              ) : (
                <View className="rounded-2xl bg-card-light-50 p-5">
                  <Text className="text-sm text-card-lighter-3 font-bbh">
                    No open safety reports.
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </NoiseComponent>
    </View>
  )
}
