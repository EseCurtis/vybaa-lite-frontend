/** UUIDs for client request IDs, including WebViews without randomUUID. */
export function createUUID(): string {
  const source = globalThis.crypto
  if (typeof source?.randomUUID === 'function') return source.randomUUID()
  if (typeof source?.getRandomValues !== 'function') {
    throw new Error('Secure random number generation is unavailable.')
  }

  // getRandomValues is also available on HTTP previews where randomUUID is not.
  const bytes = source.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (byte, index) => {
    if (index === 6) return ((byte & 0x0f) | 0x40).toString(16)
    if (index === 8) return ((byte & 0x3f) | 0x80).toString(16)
    return byte.toString(16).padStart(2, '0')
  })
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-')
}
