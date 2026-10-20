// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { StartupHandoff } from './startup-handoff.component'

const startup = vi.hoisted(() => ({ stale: true, routePending: false }))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ stale: startup.stale }),
}))
vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => startup.routePending,
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}))

afterEach(() => {
  cleanup()
  document.body.classList.remove('loaded')
  document.getElementById('app')?.remove()
  startup.stale = true
  startup.routePending = false
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('hands off only after auth and routing settle, and never replays during navigation', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 0),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  const app = document.createElement('div')
  app.id = 'app'
  app.setAttribute('inert', '')
  app.setAttribute('aria-hidden', 'true')
  document.body.append(app)
  const { rerender } = render(<StartupHandoff />)
  await act(async () => {
    await vi.runAllTimersAsync()
  })
  expect(document.body.classList.contains('loaded')).toBe(false)
  startup.stale = false
  startup.routePending = true
  rerender(<StartupHandoff />)
  await act(async () => {
    await vi.runAllTimersAsync()
  })
  expect(document.body.classList.contains('loaded')).toBe(false)
  startup.routePending = false
  rerender(<StartupHandoff />)
  await act(async () => {
    await vi.runAllTimersAsync()
  })
  expect(document.body.classList.contains('loaded')).toBe(true)
  expect(app.hasAttribute('inert')).toBe(false)
  expect(app.hasAttribute('aria-hidden')).toBe(false)
  startup.routePending = true
  startup.stale = true
  rerender(<StartupHandoff />)
  expect(document.body.classList.contains('loaded')).toBe(true)
})
