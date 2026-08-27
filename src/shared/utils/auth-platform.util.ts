export function isGoogleLoginAvailable(platform: string): boolean {
  return platform === 'android' || platform == "ios"
}
