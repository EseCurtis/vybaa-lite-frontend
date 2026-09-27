// Auth API Request/Response Types
export interface LoginRequest {
  acceptedTerms: true
  email: string
  password: string
  termsVersion: string
}

export interface RegisterRequest {
  acceptedTerms: true
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
  username?: string
  termsVersion: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOTPRequest {
  email: string
  otp: number
}

export interface ResetPasswordRequest {
  email: string
  otp: number
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface GoogleAuthRequest {
  acceptedTerms: true
  token: string
  termsVersion: string
}

export interface AppleAuthRequest {
  acceptedTerms: true
  familyName?: string
  firstName?: string
  token: string
  termsVersion: string
}

export interface User {
  id: string // Changed from uuid to match backend
  email: string
  firstName?: string // Optional to match backend
  lastName?: string // Optional to match backend
  isConfirmed: boolean
  isFirstTime: boolean
  // Profile fields
  username?: string
  avatarUrl?: string
  currentMood?: string
  rewindPersona?: 'ella' | 'lyra' | 'jake' | 'ariel' | 'tobi' | 'neeja'
  rewindPersonaCanChange?: boolean
  rewindPersonaNextChangeAt?: string
  rewindPersonalizationEnabled?: boolean
  rewindProactiveChatEnabled?: boolean
  rewindProactiveChatExplainedAt?: string
  timezone?: string
  // OAuth fields
  appleId?: string
  googleId?: string
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  msg: string
  data: {
    token: string
    refreshToken: string
    user: User
  }
}

export interface RegisterConfirmationResponse {
  msg: string
  data: {
    user: User
    confirmationRequired: true
  }
}

export interface SessionResponse {
  msg: string
  data: {
    isFirstTime: boolean
    user: User
  }
}

export interface OTPResponse {
  msg: string
  data: {
    user: {
      requestedConfirmation: boolean
    }
  }
}

export interface VerifyOTPResponse {
  msg: string
  data: {
    isValid: boolean
  }
}

export interface ResetPasswordResponse {
  msg: string
  data: {
    user: {
      isRecovered: boolean
    }
  }
}

export interface EmailCheckResponse {
  msg: string
  data: {
    available: boolean
  }
}

export interface ApiError {
  msg: string
  status: number
}

// Onboarding Types
export interface OnboardingAnswer {
  question: string
  answer: string
}

export interface GoalSuggestion {
  title: string
  description: string
  frequency: 'DAILY' | 'WEEKLY'
}

export interface OnboardingRequest {
  answers: Array<OnboardingAnswer>
  username?: string
  selectedGoals?: Array<GoalSuggestion>
}

export interface OnboardingResponse {
  msg: string
  data: {
    user: User
  }
}

// Journal Management Types
export interface Journal {
  id: string
  userId: string
  date: string
  mood?: string
  entry: string
  aiSummary?: string
  createdAt: string
}

export interface CreateJournalRequest {
  date?: string // ISO date string (YYYY-MM-DD), defaults to today
  mood?: string
  entry: string
}

export interface UpdateJournalRequest {
  mood?: string
  entry?: string
}

export interface JournalsResponse {
  msg: string
  data: {
    journals: Array<Journal>
    meta: {
      total: number
      page: number
      pageSize: number
      hasNext: boolean
    }
  }
}

export interface JournalResponse {
  msg: string
  data: {
    journal: Journal
  }
}

// Core auth state & context types used by the frontend
export type AuthUser = User

export type GoogleAuthStatus =
  | 'creating-session'
  | 'idle'
  | 'opening-google'
  | 'preparing'
  | 'verifying-google'

export type AppleAuthStatus =
  | 'creating-session'
  | 'idle'
  | 'opening-apple'
  | 'preparing'
  | 'verifying-apple'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  stale: boolean
}

export interface AuthContextValue extends AuthState {
  /**
   * Email/password login for web and native.
   */
  loginWithEmail: (data: LoginRequest) => Promise<void>

  /**
   * Email/password signup for web and native.
   * Returns the raw API response so callers can branch on confirmation state.
   */
  registerWithEmail: (
    data: RegisterRequest,
  ) => Promise<AuthResponse | RegisterConfirmationResponse>

  /**
   * Clear all auth state and tokens and notify the backend if needed.
   */
  logout: () => Promise<void>

  /**
   * Permanently delete the current account and clear local auth state.
   */
  deleteAccount: () => Promise<void>

  /**
   * Force a re-fetch of the current session from the backend.
   */
  refreshSession: () => Promise<void>
}
