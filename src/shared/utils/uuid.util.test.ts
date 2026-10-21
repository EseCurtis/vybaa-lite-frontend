import { afterEach, expect, it, vi } from 'vitest'

import { createUUID } from './uuid.util'

const getRandomValues = globalThis.crypto.getRandomValues.bind(
  globalThis.crypto,
)
const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => vi.unstubAllGlobals())

it('uses native randomUUID when available', () => {
  const randomUUID = vi.fn(() => 'native-uuid')
  vi.stubGlobal('crypto', { randomUUID })
  expect(createUUID()).toBe('native-uuid')
  expect(randomUUID).toHaveBeenCalledOnce()
})

it('creates distinct valid v4 UUIDs without randomUUID', () => {
  vi.stubGlobal('crypto', { getRandomValues })
  const ids = Array.from({ length: 1000 }, createUUID)
  expect(ids.every((id) => uuidV4.test(id))).toBe(true)
  expect(new Set(ids).size).toBe(ids.length)
})

it('sets version and variant bits even with all bits set', () => {
  vi.stubGlobal('crypto', {
    getRandomValues: (bytes: Uint8Array) => bytes.fill(255),
  })
  expect(createUUID()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
})

it('does not silently use insecure randomness if Web Crypto is missing', () => {
  vi.stubGlobal('crypto', undefined)
  expect(createUUID).toThrow('Secure random number generation is unavailable.')
})
