import { Capacitor } from "@capacitor/core"

const ENV = {
    ...import.meta.env as any,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    ENVIRONMENT: (import.meta.env.VITE_ENVIRONMENT || 'development') as 'production' | 'development' | 'staging',
    PLATFORM: Capacitor.getPlatform(),
    PLATFORMS: {
        WEB: 'web',
        IOS: 'ios',
        ANDROID: 'android',
    },
} as {
    API_BASE_URL: string
    ENVIRONMENT: 'production' | 'development' | 'staging'
    PLATFORM: 'ios' | 'android' | 'web',
    PLATFORMS: {
        WEB: 'web',
        IOS: 'ios',
        ANDROID: 'android',
    },
}

export default ENV