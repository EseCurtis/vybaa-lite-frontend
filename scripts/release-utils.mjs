export function parseOptions(args) {
  const options = {
    env: 'production',
    platform: 'all',
    bump: true,
    dryRun: false,
    check: false,
    signingFile: 'release-signing.local.json',
    open: true,
  }
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--help' || flag === '-h') {
      options.help = true
      continue
    }
    if (flag === '--no-bump') {
      options.bump = false
      continue
    }
    if (flag === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (flag === '--check') {
      options.check = true
      continue
    }
    if (flag === '--no-open') {
      options.open = false
      continue
    }
    const key = {
      '--env': 'env',
      '--platform': 'platform',
      '--signing-file': 'signingFile',
    }[flag]
    if (!key) throw new Error(`Unknown option: ${flag}. Use --help.`)
    const value = args[++index]
    if (!value || value.startsWith('--'))
      throw new Error(`${flag} requires a value.`)
    options[key] = value
  }
  if (!/^[a-z][a-z0-9_-]*$/.test(options.env) || options.env === 'local')
    throw new Error(
      'Use a Vite environment name such as production, development or staging (not local).',
    )
  if (!['all', 'android', 'ios'].includes(options.platform))
    throw new Error('--platform must be all, android or ios.')
  return options
}

function nextVersion(version) {
  const parts = version.split('.').map(Number)
  parts[parts.length - 1] += 1
  if (!parts.every(Number.isSafeInteger))
    throw new Error('Version is too large.')
  return parts.join('.')
}

export function planVersions(android, ios, bump = true) {
  const codes = [...android.matchAll(/\bversionCode\s+(\d+)/g)]
  const names = [...android.matchAll(/\bversionName\s+"(\d+(?:\.\d+){1,2})"/g)]
  const iosCodes = [...ios.matchAll(/CURRENT_PROJECT_VERSION\s*=\s*(\d+);/g)]
  const iosNames = [
    ...ios.matchAll(/MARKETING_VERSION\s*=\s*(\d+\.\d+\.\d+);/g),
  ]
  if (
    codes.length !== 1 ||
    names.length !== 1 ||
    iosCodes.length < 2 ||
    iosNames.length !== iosCodes.length
  )
    throw new Error(
      'Expected valid Android and matching iOS app/extension version fields.',
    )
  if (
    new Set(iosCodes.map((match) => match[1])).size !== 1 ||
    new Set(iosNames.map((match) => match[1])).size !== 1
  )
    throw new Error(
      'iOS app and extension versions differ. Align them before releasing.',
    )
  const androidBuild = Number(codes[0][1]) + Number(bump)
  const iosBuild = Number(iosCodes[0][1]) + Number(bump)
  if (
    !Number.isSafeInteger(androidBuild) ||
    androidBuild > 2100000000 ||
    !Number.isSafeInteger(iosBuild)
  )
    throw new Error('Build number exceeds its allowed range.')
  const androidVersion = bump ? nextVersion(names[0][1]) : names[0][1]
  const iosVersion = bump ? nextVersion(iosNames[0][1]) : iosNames[0][1]
  return {
    android: { version: androidVersion, build: androidBuild },
    ios: { version: iosVersion, build: iosBuild },
    androidContents: android
      .replace(
        /(\bversionCode\s+)\d+/,
        (_, prefix) => `${prefix}${androidBuild}`,
      )
      .replace(
        /(\bversionName\s+")[^"]+"/,
        (_, prefix) => `${prefix}${androidVersion}"`,
      ),
    iosContents: ios
      .replace(
        /(CURRENT_PROJECT_VERSION\s*=\s*)\d+;/g,
        (_, prefix) => `${prefix}${iosBuild};`,
      )
      .replace(
        /(MARKETING_VERSION\s*=\s*)\d+\.\d+\.\d+;/g,
        (_, prefix) => `${prefix}${iosVersion};`,
      ),
  }
}

export function releaseNames(env, versions, now = new Date()) {
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  return {
    day: now.toISOString().slice(0, 10),
    folder: `android-${versions.android.version}-${versions.android.build}_ios-${versions.ios.version}-${versions.ios.build}/${timestamp}`,
    aab: `Vybaa-${env}-v${versions.android.version}-build-${versions.android.build}.aab`,
    archive: `Vybaa-${env}-v${versions.ios.version}-build-${versions.ios.build}-${timestamp}.xcarchive`,
  }
}
