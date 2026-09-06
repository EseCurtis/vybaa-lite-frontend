import { describe, expect, it } from 'vitest'

import { joinApiUrl } from './api-url.util'

describe('joinApiUrl', () => {
  it('keeps exactly one slash between the origin and API path', () => {
    expect(joinApiUrl('http://localhost:4000/', '/api/v1/rewind')).toBe(
      'http://localhost:4000/api/v1/rewind',
    )
    expect(joinApiUrl('https://cloud.vybaa.app', 'api/v1/rewind')).toBe(
      'https://cloud.vybaa.app/api/v1/rewind',
    )
  })
})
