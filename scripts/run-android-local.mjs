import { spawn } from 'node:child_process'
import { networkInterfaces } from 'node:os'

const DEFAULT_PORT = 3005
const SERVER_START_TIMEOUT_MS = 30_000
const SERVER_POLL_INTERVAL_MS = 250

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
}

function getNetworkIpAddress() {
  const interfaces = networkInterfaces()
  const preferredInterfaceNames = ['en0', 'en1', 'eth0', 'wlan0']

  for (const interfaceName of preferredInterfaceNames) {
    const match = interfaces[interfaceName]?.find(
      (address) =>
        address.family === 'IPv4' &&
        !address.internal &&
        isPrivateIpv4(address.address),
    )
    if (match) return match.address
  }

  for (const addresses of Object.values(interfaces)) {
    const match = addresses?.find(
      (address) =>
        address.family === 'IPv4' &&
        !address.internal &&
        isPrivateIpv4(address.address),
    )
    if (match) return match.address
  }

  throw new Error(
    'No private network IPv4 address was found. Connect this computer to the same network as the Android device or set CAPACITOR_SERVER_URL.',
  )
}

function getServerUrl(port) {
  const override = process.env.CAPACITOR_SERVER_URL?.trim()
  if (override) return override
  return `http://${getNetworkIpAddress()}:${port}`
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(
        new Error(
          `${command} ${args.join(' ')} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`,
        ),
      )
    })
  })
}

function startVite(port) {
  return spawn(
    'vite',
    [
      '--mode',
      'base',
      '--port',
      String(port),
      '--host',
      '0.0.0.0',
      '--strictPort',
    ],
    { env: process.env, stdio: 'inherit' },
  )
}

async function waitForServer(port, viteProcess) {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (viteProcess.exitCode !== null) {
      throw new Error(`Vite stopped with exit code ${viteProcess.exitCode}`)
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}`)
      if (response.ok) return
    } catch (error) {
      if (!(error instanceof TypeError)) throw error
    }

    await new Promise((resolve) => {
      setTimeout(resolve, SERVER_POLL_INTERVAL_MS)
    })
  }

  throw new Error(`Vite did not become available on port ${port}`)
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGTERM') {
        resolve()
        return
      }
      reject(new Error(`Vite stopped with exit code ${code}`))
    })
  })
}

async function main() {
  const port = Number(process.env.CAPACITOR_DEV_SERVER_PORT ?? DEFAULT_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('CAPACITOR_DEV_SERVER_PORT must be a valid port number')
  }

  const serverUrl = getServerUrl(port)
  const capacitorEnvironment = {
    ...process.env,
    CAPACITOR_DEV_SERVER_PORT: String(port),
    CAPACITOR_SERVER_URL: serverUrl,
    CAPACITOR_USE_LOCAL_SERVER: 'true',
  }

  const viteProcess = startVite(port)
  const stopVite = () => {
    if (viteProcess.exitCode === null) viteProcess.kill('SIGTERM')
  }
  process.once('SIGINT', stopVite)
  process.once('SIGTERM', stopVite)

  try {
    await waitForServer(port, viteProcess)
    process.stdout.write(`\nAndroid local server: ${serverUrl}\n\n`)
    await runCommand('cap', ['sync', 'android'], capacitorEnvironment)

    if (process.argv.includes('--sync-only')) {
      stopVite()
      return
    }

    await runCommand('cap', ['open', 'android'], capacitorEnvironment)
    process.stdout.write(
      '\nVite is serving the Android app. Press Ctrl+C to stop it.\n',
    )
    await waitForExit(viteProcess)
  } finally {
    stopVite()
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`\nAndroid local run failed: ${message}\n`)
  process.exitCode = 1
})
