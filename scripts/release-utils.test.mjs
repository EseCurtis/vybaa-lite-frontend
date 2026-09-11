import assert from 'node:assert/strict'
import test from 'node:test'
import { parseOptions, planVersions, releaseNames } from './release-utils.mjs'

const android = 'versionCode 57\nversionName "1.56"\nminifyEnabled false'
const ios =
  'CURRENT_PROJECT_VERSION = 61;\nMARKETING_VERSION = 1.29.55;\n'.repeat(4)

test('defaults to both production releases with version bumps', () => {
  const options = parseOptions([])
  assert.equal(options.env, 'production')
  assert.equal(options.platform, 'all')
  assert.equal(options.bump, true)
})
test('supports environment, platform and safe preview/retry flags', () => {
  const options = parseOptions([
    '--env',
    'staging',
    '--platform',
    'ios',
    '--no-bump',
    '--dry-run',
    '--no-open',
  ])
  assert.equal(options.env, 'staging')
  assert.equal(options.platform, 'ios')
  assert.equal(options.bump, false)
  assert.equal(options.dryRun, true)
  assert.equal(options.open, false)
})
test('rejects malformed options and environment traversal', () => {
  for (const args of [
    ['--env'],
    ['--env', '../production'],
    ['--env', 'local'],
    ['--platform', 'web'],
    ['--unknown'],
  ]) {
    assert.throws(() => parseOptions(args))
  }
})
test('increments existing version histories and every iOS target', () => {
  const result = planVersions(android, ios)
  assert.deepEqual(result.android, { version: '1.57', build: 58 })
  assert.deepEqual(result.ios, { version: '1.29.56', build: 62 })
  assert.equal(
    result.iosContents.match(/CURRENT_PROJECT_VERSION = 62;/g).length,
    4,
  )
  assert.ok(result.androidContents.includes('minifyEnabled false'))
})
test('retry preserves source files exactly', () => {
  const result = planVersions(android, ios, false)
  assert.equal(result.androidContents, android)
  assert.equal(result.iosContents, ios)
})
test('rejects target version drift, missing fields and exhausted build numbers', () => {
  assert.throws(() => planVersions(android, ios.replace('= 61;', '= 60;')))
  assert.throws(() => planVersions('', ios))
  assert.throws(() => planVersions(android.replace('57', '2100000000'), ios))
})
test('artifact names include environment, version, build and unique run timestamp', () => {
  const names = releaseNames(
    'production',
    planVersions(android, ios),
    new Date('2026-09-09T12:00:00Z'),
  )
  assert.equal(names.aab, 'Vybaa-production-v1.57-build-58.aab')
  assert.equal(names.day, '2026-09-09')
  assert.ok(names.archive.endsWith('2026-09-09T12-00-00-000Z.xcarchive'))
  assert.ok(names.folder.startsWith('android-1.57-58_ios-1.29.56-62/'))
})
