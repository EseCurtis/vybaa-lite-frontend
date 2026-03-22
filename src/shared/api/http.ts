import ENV from '@/env'
import axios, { AxiosError, type InternalAxiosRequestConfig, } from 'axios'

export const http = axios.create({
  baseURL: `${ENV.API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Store last sent timezone to detect changes
let lastSentTimezone: string | null = null

/**
 * Get current timezone - from localStorage or browser
 */
function getCurrentTimezone(): string {
  // Try localStorage first (user's saved timezone)
  const stored = localStorage.getItem('userTimezone')
  if (stored) {
    return stored
  }

  // Fallback to browser's timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Reset timezone tracking (useful when user logs out or timezone is cleared)
 */
export function resetTimezoneTracking() {
  lastSentTimezone = null
}

/**
 * Update timezone and notify HTTP interceptor
 */
export function updateTimezone(newTimezone: string) {
  if (typeof window !== 'undefined') {
    const oldTimezone = localStorage.getItem('userTimezone')
    if (newTimezone && newTimezone !== oldTimezone) {
      localStorage.setItem('userTimezone', newTimezone)
      // Reset tracking so headers are sent on next request
      lastSentTimezone = null
      window.dispatchEvent(new CustomEvent('timezone-updated'))
    }
  }
}

// Listen for localStorage changes to detect timezone updates
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'userTimezone') {
      // Reset tracking when timezone changes in localStorage
      lastSentTimezone = null
    }
  })

  // Also listen for custom events (for same-tab updates)
  window.addEventListener('timezone-updated', () => {
    lastSentTimezone = null
  })
}

http.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    // Get current timezone
    const currentTimezone = getCurrentTimezone()
    
    // Add timezone headers only if timezone has changed or this is the first request
    if (currentTimezone && (lastSentTimezone === null || currentTimezone !== lastSentTimezone)) {
      config.headers = config.headers ?? {}
      ;(config.headers as any)['x-user-tz'] = currentTimezone
      ;(config.headers as any)['tzx'] = currentTimezone
      lastSentTimezone = currentTimezone
    }
  } catch {}
  return config
})

let isRefreshing = false
let requestQueue: Array<(token?: string) => void> = []

const processQueue = (token?: string) => {
  requestQueue.forEach((resolve) => resolve(token))
  requestQueue = []
}

export const extractError = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data.map((item) => {
      return `  ${extractError(item)}`;
    });

    return `${messages.join('')}`;
  }

  if (typeof data === 'object' && data !== null) {
    const messages = Object.entries(data).map((item) => {
      const [key, value] = item;
      const separator = Array.isArray(value) ? ':\n ' : ': ';

      return `- ${key}${separator}${extractError(value)} \n `;
    });
    return `${messages.join('')} `;
  }
  return 'Something went wrong ';
};


http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    

    const message = error?.response?.data?.msg || error?.message || 'Request failed'
    const properMessage =  extractError(
    (error?.response?.data as any)?.msg || error?.response?.data
  ).trimEnd();


    if ((status === 401 || status === 403) && !original?._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        if (isRefreshing) {
          const newToken = await new Promise<string | undefined>((resolve) => {
            requestQueue.push(resolve)
          })
          if (!newToken) throw new Error('Refresh failed')
          original.headers = original.headers ?? {}
          ;(original.headers as any).Authorization = `Bearer ${newToken}`
          return http(original)
        }

        isRefreshing = true
        const { data } = await axios.post(`${ENV.API_BASE_URL}/api/v1/auth/refresh-token`, { refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        })
        const newToken: string | undefined = data?.data?.token
        const newRefresh: string | undefined = data?.data?.refreshToken
        if (!newToken) throw new Error('No token in refresh response')
        localStorage.setItem('authToken', newToken)
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
        processQueue(newToken)
        isRefreshing = false
        original.headers = original.headers ?? {}
        ;(original.headers as any).Authorization = `Bearer ${newToken}`
        return http(original)
      } catch (e) {
        isRefreshing = false
        processQueue(undefined)
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        return Promise.reject(new Error(properMessage ||'Session expired'))
      }
    }

    return Promise.reject(new Error(message))
  },
)
