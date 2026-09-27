import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const androidPath = resolve(repoRoot, 'android/app/build.gradle')
const iosPath = resolve(repoRoot, 'ios/App/App.xcodeproj/project.pbxproj')
const versionFiles = new Set([
  'android/app/build.gradle',
  'ios/App/App.xcodeproj/project.pbxproj',
])

if (process.env.SKIP_APP_VERSION_BUMP === '1') {
  process.exit(0)
}

const stagedFiles = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMRT'],
  { cwd: repoRoot, encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean)

const hasManuallyStagedVersion = stagedFiles.some((file) =>
  versionFiles.has(file),
)
const hasAppChanges = stagedFiles.some(
  (file) =>
    !versionFiles.has(file) &&
    /^(android\/|ios\/|src\/|public\/|resources\/|package\.json$|(?:yarn|npm|pnpm)-lock\.ya?ml$|(?:capacitor|vite)\.config\.)/.test(
      file,
    ),
)

if (hasManuallyStagedVersion || !hasAppChanges) {
  process.exit(0)
}

function replaceOnce(contents, pattern, replacement, description) {
  const occurrencePattern = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  )
  const matches = contents.match(occurrencePattern)

  if (!matches || matches.length !== 1) {
    throw new Error(`Expected exactly one ${description} value.`)
  }

  return contents.replace(pattern, replacement)
}

function incrementInteger(value, description) {
  const nextValue = Number(value) + 1

  if (!Number.isSafeInteger(nextValue)) {
    throw new Error(`${description} is not a safe integer: ${value}`)
  }

  return String(nextValue)
}

function incrementAndroidVersion(contents) {
  const versionCodePattern = /(versionCode\s+)(\d+)/
  const versionNamePattern = /(versionName\s+")([^"\n]+)(")/
  const versionCode = contents.match(versionCodePattern)?.[2]
  const versionName = contents.match(versionNamePattern)?.[2]

  if (!versionCode || !versionName || !/^\d+(?:\.\d+)*$/.test(versionName)) {
    throw new Error('Android version fields are missing or invalid.')
  }

  let nextContents = replaceOnce(
    contents,
    versionCodePattern,
    `$1${incrementInteger(versionCode, 'Android versionCode')}`,
    'Android versionCode',
  )

  const versionParts = versionName.split('.')
  const lastPart = versionParts.length - 1
  versionParts[lastPart] = incrementInteger(
    versionParts[lastPart],
    'Android versionName',
  )
  nextContents = replaceOnce(
    nextContents,
    versionNamePattern,
    `$1${versionParts.join('.')}$3`,
    'Android versionName',
  )

  return nextContents
}

function incrementIosVersion(contents) {
  const buildPattern = /(CURRENT_PROJECT_VERSION\s*=\s*)(\d+)(;)/g
  const marketingPattern = /(MARKETING_VERSION\s*=\s*)(\d+)\.(\d+)\.(\d+)(;)/g
  const buildMatches = [...contents.matchAll(buildPattern)]
  const marketingMatches = [...contents.matchAll(marketingPattern)]

  if (
    buildMatches.length < 2 ||
    marketingMatches.length < 2 ||
    buildMatches.length !== marketingMatches.length
  ) {
    throw new Error('Expected matching app and extension iOS version fields.')
  }

  let nextContents = contents.replace(
    buildPattern,
    (match, prefix, value, suffix) =>
      `${prefix}${incrementInteger(value, 'iOS build number')}${suffix}`,
  )
  nextContents = nextContents.replace(
    marketingPattern,
    (match, prefix, major, minor, patch, suffix) =>
      `${prefix}${major}.${minor}.${incrementInteger(patch, 'iOS marketing version')}${suffix}`,
  )

  return nextContents
}

const androidContents = readFileSync(androidPath, 'utf8')
const iosContents = readFileSync(iosPath, 'utf8')

writeFileSync(androidPath, incrementAndroidVersion(androidContents))
writeFileSync(iosPath, incrementIosVersion(iosContents))

execFileSync(
  'git',
  [
    'add',
    '--',
    'android/app/build.gradle',
    'ios/App/App.xcodeproj/project.pbxproj',
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  },
)

console.log('Bumped Android and iOS app versions.')
