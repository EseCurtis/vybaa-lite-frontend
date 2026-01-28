 
import ENV from '@/env'
import axios from 'axios'
import { motion } from 'framer-motion'

export const PLATFORM = ENV.PLATFORM
export const DEVMODE = ENV.ENVIRONMENT == 'development'
export const PLATFORMS = ENV.PLATFORMS

export const AXIOS = axios.create({
  baseURL: ENV.API_BASE_URL,
})

export const IS_IOS = PLATFORM === PLATFORMS.IOS
export const IS_WEB = PLATFORM === PLATFORMS.WEB
export const IS_ANDROID = PLATFORM === PLATFORMS.ANDROID

export const IS_MOBILE = PLATFORM !== 'web'

export const Moti = motion
