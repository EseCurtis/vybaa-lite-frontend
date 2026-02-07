// Auth API Request/Response Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
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
  token: string
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
  lifeGoal?: string
  // OAuth fields
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

export interface AISuggestion {
  title: string
  description: string
  frequency: 'DAILY' | 'WEEKLY'
}

export interface OnboardingRequest {
  answers: Array<OnboardingAnswer>
  currentMood: string
  lifeGoal: string
  username?: string
  selectedTasks?: Array<AISuggestion>
}

export interface OnboardingResponse {
  msg: string
  data: {
    user: User
  }
}

// Task Management Types
export type TaskStatus = 'ACTIVE' | 'COMPLETED' | 'SKIPPED'
export type TaskFrequency = 'DAILY' | 'WEEKLY'
export type TaskSource = 'AI' | 'USER'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  emoji?: string
  source: TaskSource
  frequency: TaskFrequency
  status: TaskStatus
  scheduledFor: string
  completedAt?: string
  createdAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  frequency: TaskFrequency
  emoji?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  frequency?: TaskFrequency
  emoji?: string
  status?: TaskStatus
}

export interface TasksResponse {
  msg: string
  data: {
    tasks: Array<Task>
  }
}

export interface TaskResponse {
  msg: string
  data: {
    task: Task
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

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  stale: boolean
}

export interface AuthContextValue extends AuthState {
  /**
   * Perform a Google login via the native social-login plugin.
   * The provider is responsible for updating global auth state and tokens.
   */
  loginWithGoogle: () => Promise<void>

  /**
   * Clear all auth state and tokens and notify the backend if needed.
   */
  logout: () => Promise<void>

  /**
   * Force a re-fetch of the current session from the backend.
   */
  refreshSession: () => Promise<void>
}


