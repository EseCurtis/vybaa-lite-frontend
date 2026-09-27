export function isGoogleLoginAvailable(platform: string): boolean {
  return platform === 'android'
}

export function isAppleLoginAvailable(platform: string): boolean {
  return platform === 'ios'
}
