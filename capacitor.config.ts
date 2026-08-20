/// <reference types="node" />

import { networkInterfaces } from 'node:os'

import type { CapacitorConfig } from '@capacitor/cli'

const DEV_SERVER_PORT = Number(process.env.CAPACITOR_DEV_SERVER_PORT ?? 3005)
const USE_LOCAL_SERVER = process.env.CAPACITOR_USE_LOCAL_SERVER === 'true'
const SERVER_URL_OVERRIDE = process.env.CAPACITOR_SERVER_URL

function getNetworkIpAddress(): string {
  const interfaces = networkInterfaces()

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) {
      continue
    }

    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address
      }
    }
  }

  return 'localhost'
}

function getServerUrl(): string | undefined {
  if (!USE_LOCAL_SERVER) {
    return undefined
  }

  if (SERVER_URL_OVERRIDE) {
    return SERVER_URL_OVERRIDE
  }

  return `http://${getNetworkIpAddress()}:${DEV_SERVER_PORT}`
}

const serverUrl = getServerUrl()

const config: CapacitorConfig = {
  appId: 'com.vybaa.app',
  appName: 'Vybaa',
  webDir: 'dist',
  ...(serverUrl
    ? {
        server: {
          androidScheme: 'http',
          cleartext: true,
          url: serverUrl,
        },
      }
    : {}),
  plugins: {
    PushNotifications: {
      presentationOptions: [],
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      providers: {
        google: true,
      },
      logLevel: 1,
    },
  },
}

export default config
