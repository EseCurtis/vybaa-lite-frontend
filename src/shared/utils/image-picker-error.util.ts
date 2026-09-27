function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase()
  }

  if (typeof error === 'string') {
    return error.toLowerCase()
  }

  return ''
}

export function isImagePickerCancellation(error: unknown): boolean {
  const message = getErrorMessage(error)
  return message.includes('cancelled') || message.includes('canceled')
}

export function getImagePickerFailureMessage(error: unknown): string {
  const message = getErrorMessage(error)

  if (message.includes('permission') || message.includes('denied')) {
    return 'Allow camera or photo access in Settings to choose an image.'
  }

  if (message.includes('unavailable') || message.includes('not available')) {
    return 'The selected image source is not available on this device.'
  }

  return 'Unable to open your camera or photos. Please try again.'
}
