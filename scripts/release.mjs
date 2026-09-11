import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, createReadStream, createWriteStream } from 'node:fs'
import {
  access,
  copyFile,
  mkdir,
  open,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseOptions, planVersions, releaseNames } from './release-utils.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidFile = join(root, 'android/app/build.gradle')
const iosFile = join(root, 'ios/App/App.xcodeproj/project.pbxproj')

function capture(command, args, env = process.env) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    throw new Error(
      `${command} check failed. Confirm the required tools, signing credentials and Xcode setup in docs/releases.md.`,
    )
  }
}

async function run(command, args, { env, cwd = root, log }) {
  console.log(`Running ${command} ${args.join(' ')}`)
  console.log(`Build log: ${log}`)
  const output = createWriteStream(log, { flags: 'a', mode: 0o600 })
  try {
    await new Promise((resolveRun, reject) => {
      const child = spawn(command, args, {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child.stdout.pipe(output, { end: false })
      child.stderr.pipe(output, { end: false })
      child.once('error', reject)
      child.once('close', (code, signal) =>
        code === 0
          ? resolveRun()
          : reject(
              new Error(`Build step failed (${signal ?? code}). See ${log}`),
            ),
      )
      output.once('error', reject)
    })
  } finally {
    await new Promise((done) => output.end(done))
  }
}

async function signingEnvironment(options) {
  let config = {}
  const file = resolve(root, options.signingFile)
  try {
    config = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (
      error.code !== 'ENOENT' ||
      options.signingFile !== 'release-signing.local.json'
    )
      throw new Error(`Cannot read signing configuration: ${file}`)
  }
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new Error('Signing configuration must be a JSON object.')
  const env = {
    ...process.env,
    CAPACITOR_USE_LOCAL_SERVER: 'false',
    NODE_ENV: 'production',
  }
  delete env.CAPACITOR_SERVER_URL
  for (const key of [
    'VYBAA_ANDROID_KEYSTORE',
    'VYBAA_ANDROID_STORE_PASSWORD',
    'VYBAA_ANDROID_KEY_ALIAS',
    'VYBAA_ANDROID_KEY_PASSWORD',
  ]) {
    if (!env[key] && typeof config[key] === 'string') env[key] = config[key]
  }
  if (options.platform !== 'ios') {
    const missing = [
      'VYBAA_ANDROID_KEYSTORE',
      'VYBAA_ANDROID_STORE_PASSWORD',
      'VYBAA_ANDROID_KEY_ALIAS',
      'VYBAA_ANDROID_KEY_PASSWORD',
    ].filter((key) => !env[key])
    if (missing.length)
      throw new Error(
        `Android signing is incomplete: ${missing.join(', ')}. See docs/releases.md.`,
      )
    env.VYBAA_ANDROID_KEYSTORE = resolve(
      dirname(file),
      env.VYBAA_ANDROID_KEYSTORE,
    )
    await access(env.VYBAA_ANDROID_KEYSTORE, constants.R_OK)
    if (process.platform === 'darwin')
      env.JAVA_HOME = capture('/usr/libexec/java_home', ['-v', '21'])
    if (!env.JAVA_HOME) throw new Error('Set JAVA_HOME to JDK 21.')
    env.PATH = `${join(env.JAVA_HOME, 'bin')}:${env.PATH ?? ''}`
    capture(join(env.JAVA_HOME, 'bin/java'), ['-version'], env)
    capture(
      join(env.JAVA_HOME, 'bin/keytool'),
      [
        '-list',
        '-keystore',
        env.VYBAA_ANDROID_KEYSTORE,
        '-storepass:env',
        'VYBAA_ANDROID_STORE_PASSWORD',
        '-alias',
        env.VYBAA_ANDROID_KEY_ALIAS,
      ],
      env,
    )
    const sdk =
      env.ANDROID_HOME ??
      env.ANDROID_SDK_ROOT ??
      join(homedir(), 'Library/Android/sdk')
    await access(join(sdk, 'platforms/android-36/android.jar'))
    env.ANDROID_HOME = sdk
  }
  if (options.platform !== 'android') {
    if (process.platform !== 'darwin')
      throw new Error('iOS archives require macOS and Xcode.')
    capture('xcodebuild', ['-version'], env)
    capture('pod', ['--version'], env)
    const identities = capture(
      'security',
      ['find-identity', '-v', '-p', 'codesigning'],
      env,
    )
    if (!/"Apple (Development|Distribution):/.test(identities))
      throw new Error(
        'No Apple signing identity found. Sign in to Xcode and create an Apple Development or Distribution certificate.',
      )
    await access(join(root, 'ios/App/App.xcworkspace/contents.xcworkspacedata'))
  }
  return env
}

async function checksum(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  if (options.help) {
    console.log(`Usage: npm run release -- [options]
  --env production|development|staging  Vite mode (default production)
  --platform all|android|ios            Platforms (default all)
  --check                              Check signing/tooling; do not build or bump
  --dry-run                            Preview versions/paths without signing checks
  --no-bump                            Retry the current native versions
  --signing-file PATH                   Default release-signing.local.json
  --no-open                            Do not open the iOS archive in Xcode

Builds use Release configuration in every environment. No upload is performed.
See docs/releases.md for signing, versioning, output folders and retry steps.`)
    return
  }
  // Require a named mode file so a misspelled environment cannot silently fall back.
  await access(join(root, `.env.${options.env}`))
  const [android, ios] = await Promise.all([
    readFile(androidFile, 'utf8'),
    readFile(iosFile, 'utf8'),
  ])
  const versions = planVersions(android, ios, options.bump)
  const names = releaseNames(options.env, versions)
  const output = join(root, 'releases', options.env, names.folder)
  const archive = join(
    homedir(),
    'Library/Developer/Xcode/Archives',
    names.day,
    names.archive,
  )
  console.log(
    `Environment: ${options.env}\nAndroid: ${versions.android.version} (${versions.android.build})\niOS: ${versions.ios.version} (${versions.ios.build})\nOutput: ${output}`,
  )
  if (options.platform !== 'android') console.log(`Xcode archive: ${archive}`)
  if (options.dryRun) return
  await access(join(root, 'node_modules/.bin/vite'), constants.X_OK)
  await access(join(root, 'node_modules/.bin/cap'), constants.X_OK)
  const env = await signingEnvironment(options)
  if (options.check) {
    console.log('Release prerequisites passed. No versions or files changed.')
    return
  }
  const commit = capture('git', ['rev-parse', 'HEAD'])
  const dirty = Boolean(capture('git', ['status', '--porcelain']))
  await mkdir(join(root, 'releases'), { recursive: true })
  const lockPath = join(root, 'releases/.release.lock')
  const lock = await open(lockPath, 'wx').catch(() => {
    throw new Error(
      'A release lock exists. If no release is running, remove releases/.release.lock and retry.',
    )
  })
  const manifest = {
    environment: options.env,
    platform: options.platform,
    startedAt: new Date().toISOString(),
    commit,
    dirty,
    versions: { android: versions.android, ios: versions.ios },
    status: 'building',
    artifacts: {},
  }
  try {
    // Another release may have completed while preflight ran. Never reuse a stale plan.
    if (
      (await readFile(androidFile, 'utf8')) !== android ||
      (await readFile(iosFile, 'utf8')) !== ios
    )
      throw new Error(
        'Native versions changed during preflight. Run the command again.',
      )
    await mkdir(output, { recursive: true })
    if (options.bump) {
      await writeFile(androidFile, versions.androidContents)
      await writeFile(iosFile, versions.iosContents)
    }
    await writeFile(
      join(output, 'release.json'),
      JSON.stringify(manifest, null, 2),
    )
    await run(
      join(root, 'node_modules/.bin/vite'),
      ['build', '--mode', options.env],
      { env, log: join(output, 'web.log') },
    )
    await writeFile(
      join(root, 'dist/release.json'),
      JSON.stringify({
        environment: options.env,
        versions: manifest.versions,
        commit: manifest.commit,
      }),
    )
    const platforms =
      options.platform === 'all' ? ['android', 'ios'] : [options.platform]
    for (const platform of platforms) {
      await run(join(root, 'node_modules/.bin/cap'), ['sync', platform], {
        env,
        log: join(output, `${platform}-sync.log`),
      })
      const configPath =
        platform === 'android'
          ? 'android/app/src/main/assets/capacitor.config.json'
          : 'ios/App/App/capacitor.config.json'
      const nativeConfig = JSON.parse(
        await readFile(join(root, configPath), 'utf8'),
      )
      if (nativeConfig.server?.url)
        throw new Error(
          'Release contains a live-reload server URL. Build stopped.',
        )
      if (platform === 'android') {
        await run(
          join(root, 'android/gradlew'),
          [':app:bundleRelease', '--no-daemon', '--console=plain'],
          {
            cwd: join(root, 'android'),
            env,
            log: join(output, 'android-build.log'),
          },
        )
        const built = join(
          root,
          'android/app/build/outputs/bundle/release/app-release.aab',
        )
        const verification = capture(
          join(env.JAVA_HOME, 'bin/jarsigner'),
          ['-J-Duser.language=en', '-verify', built],
          env,
        )
        if (
          !verification.includes('jar verified.') ||
          /unsigned entries|jar is unsigned/i.test(verification)
        )
          throw new Error('Android bundle signature verification failed.')
        const destination = join(output, names.aab)
        await copyFile(built, destination, constants.COPYFILE_EXCL)
        manifest.artifacts.android = {
          path: destination,
          sha256: await checksum(destination),
        }
      } else {
        await mkdir(dirname(archive), { recursive: true })
        await run(
          'xcodebuild',
          [
            '-workspace',
            'ios/App/App.xcworkspace',
            '-scheme',
            'Vybaa',
            '-configuration',
            'Release',
            '-destination',
            'generic/platform=iOS',
            '-archivePath',
            archive,
            '-derivedDataPath',
            join(output, 'ios-derived-data'),
            '-allowProvisioningUpdates',
            'archive',
          ],
          { env, log: join(output, 'ios-archive.log') },
        )
        const application = join(archive, 'Products/Applications/Vybaa.app')
        await access(join(application, 'Info.plist'))
        capture(
          'codesign',
          ['--verify', '--deep', '--strict', application],
          env,
        )
        const archiveInfo = JSON.parse(
          capture(
            'plutil',
            ['-convert', 'json', '-o', '-', join(archive, 'Info.plist')],
            env,
          ),
        )
        if (!archiveInfo.ApplicationProperties?.ApplicationPath)
          throw new Error(
            'Archive does not contain a distributable app. Inspect ios-archive.log.',
          )
        manifest.artifacts.ios = { path: archive }
        await writeFile(join(output, 'ios-archive-path.txt'), `${archive}\n`)
      }
      await writeFile(
        join(output, 'release.json'),
        JSON.stringify(manifest, null, 2),
      )
    }
    manifest.status = 'complete'
    manifest.finishedAt = new Date().toISOString()
    await writeFile(
      join(output, 'release.json'),
      JSON.stringify(manifest, null, 2),
    )
    console.log(`Release ready: ${output}`)
    if (manifest.artifacts.ios && options.open) {
      try {
        capture('open', ['-a', 'Xcode', archive], env)
      } catch {
        console.warn(`Archive is ready. Open it manually: ${archive}`)
      }
    }
  } catch (error) {
    manifest.status = 'failed'
    manifest.error = error.message
    await mkdir(output, { recursive: true })
    await writeFile(
      join(output, 'release.json'),
      JSON.stringify(manifest, null, 2),
    )
    throw error
  } finally {
    await lock.close()
    await unlink(lockPath)
  }
}

main().catch((error) => {
  console.error(`Release failed: ${error.message}`)
  process.exitCode = 1
})
