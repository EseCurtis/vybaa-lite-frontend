import { isAxiosError } from 'axios'

interface ApiErrorPayload {
  message?: unknown
  msg?: unknown
}

function getPayloadMessage(
  payload: ApiErrorPayload | undefined,
): string | null {
  if (typeof payload?.msg === 'string' && payload.msg.trim()) {
    return payload.msg.trim()
  }
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim()
  }
  return null
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorPayload>(error)) {
    return getPayloadMessage(error.response?.data) ?? error.message ?? fallback
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  return fallback
}
