import { TopNotch } from '@/components/common/notch.component'
import { QueryFeedback } from '@/components/common/query-feedback.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { UserQuestionnaire } from '@/components/custom/onboarding/user-questionnaire.component'
import { Pressable } from '@/components/layout/pressables.component'
import { useAuth } from '@/providers/auth.provider'
import { authAPI } from '@/shared/api/auth.api'
import { ApiError } from '@/shared/api/http'
import type {
  OnboardingData,
  OnboardingProfile,
} from '@/shared/api/onboarding.api'
import { onboardingAPI } from '@/shared/api/onboarding.api'
import {
  clearQuestionnaireDraft,
  markQuestionnaireSeen,
} from '@/shared/onboarding/questionnaire.util'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'

export default function UserOnboardingScreen() {
  const { user, refreshSession } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const query = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: ({ signal }) => onboardingAPI.get(signal),
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  async function save(profile: OnboardingProfile): Promise<void> {
    if (!user || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    let didSave = false
    try {
      const response = await authAPI.completeOnboarding({
        answers: [],
        profile,
      })
      didSave = true
      setSaved(true)
      clearQuestionnaireDraft(user.id)
      markQuestionnaireSeen(user.id)
      queryClient.setQueryData<OnboardingData>(
        ['onboarding', user.id],
        (previous) =>
          previous
            ? {
                ...previous,
                profile: { ...profile, revision: profile.revision + 1 },
              }
            : previous,
      )
      try {
        await refreshSession()
      } catch {
        /* Saved completion and the local seen marker prevent a redirect loop. */
      }
      if (user.isFirstTime) await navigateAfterAuth(router, response.data.user)
      else await router.navigate({ replace: true, to: '/app/profile' })
    } catch (failure: unknown) {
      let message =
        'Couldn’t save your answers. Your draft is kept—check your connection and try again.'
      if (failure instanceof ApiError && failure.status === 409)
        message =
          'Your answers changed on another device. Close and reopen About you to review the latest answers.'
      if (didSave)
        message = 'Your preferences are saved. You can continue from Profile.'
      setError(message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function leave(): Promise<void> {
    if (!user || savingRef.current) return
    if (!user.isFirstTime) {
      await router.navigate({ to: '/app/profile' })
      return
    }
    if (query.data) {
      await save({
        version: 1,
        revision: query.data.profile?.revision ?? 0,
        skipped: true,
        answers: [],
      })
    } else {
      // Optional onboarding must not lock an offline user out of the app.
      markQuestionnaireSeen(user.id)
      await navigateAfterAuth(router, { ...user, isFirstTime: false })
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-cardd font-bbh text-white">
      <TopNotch />
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 px-5">
        <span className="text-lg font-bold">Lets get to know you.</span>
        <Pressable
          type="button"
          disabled={saving}
          onPress={() => void leave()}
          className="min-h-11 min-w-11 items-center justify-center px-2 text-sm font-semibold"
        >
          {user?.isFirstTime ? 'Not now' : 'Close'}
        </Pressable>
      </header>
      {error ? (
        <div className="px-5 py-2">
          <p role="alert" className="text-sm leading-6 text-danger-400">
            {error}
          </p>
          <Pressable
            type="button"
            onPress={() => {
              if (user) markQuestionnaireSeen(user.id)
              void router.navigate({ replace: true, to: '/app/profile' })
            }}
            className="min-h-11 text-sm text-card-lighter-3"
          >
            Finish later in Profile
          </Pressable>
        </div>
      ) : null}
      {query.isPending ? (
        <div
          role="status"
          aria-label="Loading your preferences"
          className="space-y-5 p-5"
        >
          <Skeleton className="h-16 w-4/5" />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-14 w-full" rounded="xl" />
          ))}
        </div>
      ) : null}
      {query.isError && !query.data ? (
        <QueryFeedback
          message="Couldn’t load your preferences."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
      {saved ? (
        <p role="status" className="px-5 py-8 text-sm text-card-lighter-2">
          Preferences saved. Opening Vybaa…
        </p>
      ) : null}
      {query.data && user && !saved ? (
        <UserQuestionnaire
          key={`${user.id}:${query.data.profile?.revision ?? 0}`}
          data={query.data}
          userId={user.id}
          saving={saving}
          onSave={(profile) => void save(profile)}
        />
      ) : null}
    </div>
  )
}
