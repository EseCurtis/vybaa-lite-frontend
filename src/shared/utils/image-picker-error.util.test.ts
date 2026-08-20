import { describe, expect, it } from 'vitest'

import {
  getImagePickerFailureMessage,
  isImagePickerCancellation,
} from './image-picker-error.util'

describe('image picker errors', () => {
  it.each(['User cancelled photos app', 'User canceled camera app'])(
    'recognizes cancellation: %s',
    (message) => {
      expect(isImagePickerCancellation(new Error(message))).toBe(true)
    },
  )

  it('returns a permission recovery message', () => {
    expect(getImagePickerFailureMessage(new Error('Permission denied'))).toBe(
      'Allow camera or photo access in Settings to choose an image.',
    )
  })

  it('returns an unavailable-source message', () => {
    expect(getImagePickerFailureMessage(new Error('Camera unavailable'))).toBe(
      'The selected image source is not available on this device.',
    )
  })
})
