import type { PropsWithChildren } from 'react'

export function blocked(): never {
  throw new Error('Capture sandbox: live operation blocked')
}
export function noop(): void {
  /* No native side effects in fictional captures. */
}
export function useNavigate() {
  return noop
}
export function useParams() {
  return { goalId: 'capture-goal', sessionId: 'capture-session' }
}
export function useLocation() {
  return { pathname: '/creative-capture' }
}
export function useRouter() {
  return { history: { back: noop } }
}
export function useAuth() {
  return {
    user: {
      id: 'chet',
      firstName: 'Chet',
      username: 'chet',
      rewindPersona: 'jake',
      rewindProactiveChatExplainedAt: '2026-09-01',
    },
    refreshSession: noop,
  }
}
const notifications = { isConnected: true, subscribeRewindChat: () => noop }
export function useNotificationContext() {
  return notifications
}
export function useBottomSheetController() {
  return { present: blocked, dismiss: noop }
}
export function useToast() {
  return { success: noop, error: blocked, warning: noop, info: noop }
}
export function useProAccess() {
  return { handleSubscriptionError: blocked, requestProAccess: blocked }
}
export function useSubscription() {
  return {
    isLoading: false,
    isPro: true,
    isSupported: true,
  }
}
export function useKeyboard() {
  return { isKeyboardVisible: false }
}
export function useSafeAreaInsets() {
  return { top: 0, bottom: 0, left: 0, right: 0 }
}
export function KeyboardAvoidingView({ children }: PropsWithChildren) {
  return <>{children}</>
}
export const hapticFeedback = {
  light: noop,
  medium: noop,
  heavy: noop,
  selection: noop,
  success: noop,
}
export const authAPI = { updateProfile: blocked }
export const http = {
  get: blocked,
  post: blocked,
  patch: blocked,
  delete: blocked,
  put: blocked,
}
export class ApiError extends Error {}
export function getCurrentTimezone() {
  return 'Africa/Lagos'
}
export function getGoalAlarmsEnabled() {
  return false
}
export function hasSeenGoalAlarmOnboarding() {
  return true
}
export const markGoalAlarmOnboardingSeen = noop
export const setGoalAlarmsEnabled = blocked
