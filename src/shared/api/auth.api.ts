import { http } from '@/shared/api/http'
import type {
  GoalSuggestion,
  AuthResponse,
  EmailCheckResponse,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  OnboardingRequest,
  OnboardingResponse,
  OTPResponse,
  RefreshTokenRequest,
  RegisterConfirmationResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SessionResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  User,
} from '@/shared/types/auth.types'

const API_V1 = '/api/v1'

class AuthAPI {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: res } = await http.post<AuthResponse>(
      `${API_V1}/auth/login`,
      data,
    )
    return res
  }

  async register(
    data: RegisterRequest,
  ): Promise<AuthResponse | RegisterConfirmationResponse> {
    const { data: res } = await http.post<
      AuthResponse | RegisterConfirmationResponse
    >(`${API_V1}/auth/register`, data)
    return res
  }

  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    const { data: res } = await http.post<AuthResponse>(
      `${API_V1}/auth/google`,
      data,
    )
    return res
  }

  async requestPasswordReset(
    data: ForgotPasswordRequest,
  ): Promise<OTPResponse> {
    const { data: res } = await http.post<OTPResponse>(
      `${API_V1}/auth/request-validation`,
      data,
    )
    return res
  }

  async verifyRecoveryOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const { data: res } = await http.post<VerifyOTPResponse>(
      `${API_V1}/auth/verify-recovery-code`,
      data,
    )
    return res
  }

  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const { data: res } = await http.post<ResetPasswordResponse>(
      `${API_V1}/auth/recover-account`,
      data,
    )
    return res
  }

  async requestConfirmation(email: string): Promise<OTPResponse> {
    const { data: res } = await http.post<OTPResponse>(
      `${API_V1}/auth/request-confirmation`,
      { email },
    )
    return res
  }

  async confirmAccount(data: VerifyOTPRequest): Promise<any> {
    const { data: res } = await http.post<any>(
      `${API_V1}/auth/account-confirmation`,
      data,
    )
    return res
  }

  async getSession(): Promise<SessionResponse> {
    const { data: res } = await http.post<SessionResponse>(
      `${API_V1}/auth/session`,
    )
    return res
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    const { data: res } = await http.post<AuthResponse>(
      `${API_V1}/auth/refresh-token`,
      data,
    )
    return res
  }

  async logout({ fcmToken }: { fcmToken: string }): Promise<void> {
    await http.post(`${API_V1}/auth/logout`, {
      fcmToken,
    })
  }

  async checkEmail(email: string): Promise<EmailCheckResponse> {
    const { data: res } = await http.get<EmailCheckResponse>(
      `${API_V1}/auth/email-check/${email}`,
    )
    return res
  }

  async getSuggestions(
    data: Omit<OnboardingRequest, 'selectedGoals'>,
  ): Promise<{ msg: string; data: { suggestedGoals: GoalSuggestion[] } }> {
    const { data: res } = await http.post<{
      msg: string
      data: { suggestedGoals: GoalSuggestion[] }
    }>(`${API_V1}/auth/suggestions`, data)
    return res
  }

  async completeOnboarding(
    data: OnboardingRequest,
  ): Promise<OnboardingResponse> {
    const { data: res } = await http.post<OnboardingResponse>(
      `${API_V1}/auth/onboarding`,
      data,
    )
    return res
  }

  async updateProfile(data: {
    firstName?: string
    lastName?: string
    username?: string
    profileImageId?: string
    rewindPersona?: 'ella' | 'lyra' | 'jake' | 'ariel' | 'tobi' | 'neeja' | null
    rewindPersonalizationEnabled?: boolean
    rewindProactiveChatEnabled?: boolean
    rewindProactiveChatExplainedAt?: string | null
    timezone?: string
  }): Promise<{ msg: string; data: User }> {
    const { data: res } = await http.put<{ msg: string; data: User }>(
      `${API_V1}/users/me`,
      data,
    )
    return res
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<{ msg: string }> {
    const { data: res } = await http.post<{ msg: string }>(
      `${API_V1}/auth/change-password`,
      data,
    )
    return res
  }
}

export const authAPI = new AuthAPI()
