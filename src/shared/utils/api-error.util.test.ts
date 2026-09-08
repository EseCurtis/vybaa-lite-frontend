import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './api-error.util'

describe('getApiErrorMessage', () => {
  it('prefers the API response message', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed with status code 429',
      response: {
        data: { msg: 'You can switch your Rewind partner once per day' },
      },
    }

    expect(getApiErrorMessage(error, 'Could not save')).toBe(
      'You can switch your Rewind partner once per day',
    )
  })

  it('falls back to an ordinary error message', () => {
    expect(getApiErrorMessage(new Error('Network unavailable'), 'Failed')).toBe(
      'Network unavailable',
    )
  })

  it('uses the fallback for an unknown value', () => {
    expect(getApiErrorMessage(null, 'Could not save')).toBe('Could not save')
  })
})
