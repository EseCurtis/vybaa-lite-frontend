// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  startVoiceRecording,
  stopVoiceRecording,
} from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { transcriptionAPI } from '@/shared/api/transcription.api'
import type { Transcript } from '@/shared/api/transcription.api'
import { AudioTranscription } from './audio-transcription.component'

vi.mock('@/plugins/capacitor/plugins/voice-recorder.plugin', () => ({
  startVoiceRecording: vi.fn(),
  stopVoiceRecording: vi.fn(),
}))
const makeURL = vi.fn(() => 'blob:recording-preview')
const revokeURL = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = makeURL
      static revokeObjectURL = revokeURL
    },
  )
  vi.mocked(startVoiceRecording).mockResolvedValue(undefined)
  vi.mocked(stopVoiceRecording).mockResolvedValue({
    audioUrl: 'data:audio/wav;base64,UklGRjAwMDBXQVZF',
    base64: 'UklGRjAwMDBXQVZF',
    durationMs: 3000,
    mimeType: 'audio/wav',
  })
})
afterEach(async () => {
  cleanup()
  await act(async () => undefined)
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function Editor({ maxLength = 5000 }: { maxLength?: number }) {
  const [value, setValue] = useState('Already written.')
  return (
    <>
      <label>
        Editor
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <AudioTranscription
        value={value}
        onChange={setValue}
        maxLength={maxLength}
      />
    </>
  )
}

it('records real audio, transcribes it once, and appends only after review', async () => {
  const create = vi
    .spyOn(transcriptionAPI, 'create')
    .mockResolvedValue({ text: 'My spoken words.', language: 'eng' })
  render(<Editor />)
  fireEvent.click(screen.getByRole('button', { name: 'Record audio' }))
  await screen.findByRole('button', { name: 'Stop and transcribe' })
  expect(startVoiceRecording).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Stop and transcribe' }))
  await screen.findByLabelText('Review transcript')
  expect(stopVoiceRecording).toHaveBeenCalledOnce()
  expect(create).toHaveBeenCalledOnce()
  expect(create.mock.calls[0]?.[0].type).toBe('audio/wav')
  expect(create.mock.calls[0]?.[0].size).toBe(12)
  expect(screen.getByLabelText<HTMLTextAreaElement>('Editor').value).toBe(
    'Already written.',
  )
  fireEvent.change(screen.getByLabelText('Review transcript'), {
    target: { value: 'Corrected words.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add to text' }))
  expect(screen.getByLabelText<HTMLTextAreaElement>('Editor').value).toBe(
    'Already written.\n\nCorrected words.',
  )
  expect(screen.queryByLabelText('Review transcript')).toBeNull()
  expect(revokeURL).toHaveBeenCalledWith('blob:recording-preview')
})

it('imports audio, retains it after failure and retries with the same request ID', async () => {
  const create = vi
    .spyOn(transcriptionAPI, 'create')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ text: 'Imported words.', language: null })
  render(<Editor />)
  const input = screen.getByLabelText('Choose audio recording')
  fireEvent.change(input, {
    target: { files: [new File(['RIFF0000WAVE'], 'voice.m4a', { type: '' })] },
  })
  await screen.findByText('Offline')
  expect(screen.getByLabelText('Recording preview')).toBeTruthy()
  const first = create.mock.calls[0]
  const retry = screen.getByRole('button', { name: 'Retry transcription' })
  fireEvent.click(retry)
  fireEvent.click(retry)
  await screen.findByLabelText('Review transcript')
  expect(create).toHaveBeenCalledTimes(2)
  expect(create.mock.calls[1]?.[0]).toBe(first?.[0])
  expect(create.mock.calls[1]?.[1]).toBe(first?.[1])
  expect(first?.[0].type).toBe('audio/mp4')
  expect(startVoiceRecording).not.toHaveBeenCalled()
})

it('preserves the latest typed text and requires shortening instead of silently truncating', async () => {
  vi.spyOn(transcriptionAPI, 'create').mockResolvedValue({
    text: 'This recording is much too long.',
    language: null,
  })
  render(<Editor maxLength={30} />)
  fireEvent.change(screen.getByLabelText('Choose audio recording'), {
    target: {
      files: [new File(['data'], 'voice.mp3', { type: 'audio/mpeg' })],
    },
  })
  await screen.findByLabelText('Review transcript')
  expect(
    screen
      .getByRole('button', { name: 'Add to text' })
      .hasAttribute('disabled'),
  ).toBe(true)
  expect(screen.getByText(/Shorten the transcript/)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Review transcript'), {
    target: { value: '' },
  })
  expect(screen.getByLabelText('Review transcript')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Editor'), {
    target: { value: 'Edited meanwhile.' },
  })
  fireEvent.change(screen.getByLabelText('Review transcript'), {
    target: { value: 'Short.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add to text' }))
  expect(screen.getByLabelText<HTMLTextAreaElement>('Editor').value).toBe(
    'Edited meanwhile.\n\nShort.',
  )
})

it('handles denied permission and invalid files without losing typed text', async () => {
  const create = vi.spyOn(transcriptionAPI, 'create')
  vi.mocked(startVoiceRecording).mockRejectedValueOnce(
    new Error('Microphone permission was denied.'),
  )
  render(<Editor />)
  fireEvent.click(screen.getByRole('button', { name: 'Record audio' }))
  await screen.findByText('Microphone permission was denied.')
  fireEvent.change(screen.getByLabelText('Choose audio recording'), {
    target: { files: [new File([], 'empty.wav', { type: 'audio/wav' })] },
  })
  await screen.findByText('This recording is empty. Please try again.')
  expect(create).not.toHaveBeenCalled()
  expect(screen.getByLabelText<HTMLTextAreaElement>('Editor').value).toBe(
    'Already written.',
  )
})

it('aborts an in-flight transcription when dismissed and ignores late results', async () => {
  let complete: (value: Transcript) => void = () => undefined
  const create = vi.spyOn(transcriptionAPI, 'create').mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve
      }),
  )
  const view = render(<Editor />)
  fireEvent.change(screen.getByLabelText('Choose audio recording'), {
    target: { files: [new File(['audio'], 'voice.mp3')] },
  })
  await waitFor(() => expect(create).toHaveBeenCalledOnce())
  const signal = create.mock.calls[0]?.[2]
  fireEvent.click(screen.getByRole('button', { name: 'Discard recording' }))
  expect(signal?.aborted).toBe(true)
  await act(async () => complete({ text: 'Must not appear', language: null }))
  expect(screen.queryByDisplayValue('Must not appear')).toBeNull()
  expect(screen.getByLabelText<HTMLTextAreaElement>('Editor').value).toBe(
    'Already written.',
  )
  view.unmount()
})

it('stops the owned microphone on unmount even if the permission prompt resolves late', async () => {
  let started: () => void = () => undefined
  vi.mocked(startVoiceRecording).mockImplementation(
    () =>
      new Promise((resolve) => {
        started = resolve
      }),
  )
  const create = vi.spyOn(transcriptionAPI, 'create')
  const view = render(<Editor />)
  fireEvent.click(screen.getByRole('button', { name: 'Record audio' }))
  view.unmount()
  await act(async () => started())
  await waitFor(() => expect(stopVoiceRecording).toHaveBeenCalledOnce())
  expect(create).not.toHaveBeenCalled()
})

it('automatically stops a recording at five minutes', async () => {
  vi.useFakeTimers()
  const create = vi
    .spyOn(transcriptionAPI, 'create')
    .mockResolvedValue({ text: 'Time limited recording.', language: null })
  render(<Editor />)
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Record audio' })),
  )
  await act(async () => vi.advanceTimersByTimeAsync(300_000))
  expect(stopVoiceRecording).toHaveBeenCalledOnce()
  expect(create).toHaveBeenCalledOnce()
  expect(screen.getByLabelText('Review transcript')).toBeTruthy()
})

it('rejects oversized imports before making a paid request', async () => {
  const create = vi.spyOn(transcriptionAPI, 'create')
  render(<Editor />)
  fireEvent.change(screen.getByLabelText('Choose audio recording'), {
    target: {
      files: [
        new File([new Uint8Array(12 * 1024 * 1024 + 1)], 'large.wav', {
          type: 'audio/wav',
        }),
      ],
    },
  })
  expect(
    await screen.findByText('Audio must be 12 MB or smaller.'),
  ).toBeTruthy()
  expect(create).not.toHaveBeenCalled()
})
