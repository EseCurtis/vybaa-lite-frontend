// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { getDailyPrompt } from '@/shared/data/journal-prompts'
import { transcriptionAPI } from '@/shared/api/transcription.api'
import type { Journal } from '@/shared/types/auth.types'
import { JournalInsightSheet } from '@/components/journal/journal-insight.sheet'

import JournalEditorScreen from './$date.screen'

interface JournalMocks {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  navigate: ReturnType<typeof vi.fn>
  loading: boolean
  journal: Pick<Journal, 'entry' | 'id' | 'mood'> | null
  saving: boolean
}

const mocks = vi.hoisted<JournalMocks>(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  navigate: vi.fn(),
  loading: false,
  journal: null,
  saving: false,
}))

vi.mock('@/hooks/use-journal.hook', () => ({
  useJournalByDate: () => ({
    data: { data: { journal: mocks.journal } },
    isLoading: mocks.loading,
  }),
  useCreateJournal: () => ({
    mutateAsync: mocks.create,
    isPending: mocks.saving,
  }),
  useUpdateJournal: () => ({ mutateAsync: mocks.update, isPending: false }),
  useDeleteJournal: () => ({ mutateAsync: mocks.remove, isPending: false }),
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('@/components/common/tab-header.component', () => ({
  TabHeader: ({ title, children }: { title: string; children: ReactNode }) => (
    <header>
      {title}
      {children}
    </header>
  ),
}))
vi.mock('@/plugins/capacitor/plugins/voice-recorder.plugin', () => ({
  getVoiceRecordingStatus: async () => ({ status: 'NONE' }),
  startVoiceRecording: vi.fn(),
  stopVoiceRecording: vi.fn(),
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ info: vi.fn(), success: vi.fn(), error: vi.fn() }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.loading = false
  mocks.journal = null
  mocks.saving = false
  vi.stubGlobal('alert', vi.fn())
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('journal composer', () => {
  it('preserves the date-based prompt and empty-entry validation', () => {
    render(<JournalEditorScreen date="2026-10-18" />)
    expect(
      screen.getByText(getDailyPrompt(new Date('2026-10-18'))),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Happy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save journal' }))
    expect(window.alert).toHaveBeenCalledWith(
      'Please write something before saving',
    )
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('keeps all eight moods selectable and submits the original create contract', async () => {
    render(<JournalEditorScreen date="2026-10-18" />)
    const moods = screen.getByRole('group', { name: 'Journal mood' })
    expect(moods.querySelectorAll('button')).toHaveLength(8)
    fireEvent.click(screen.getByRole('button', { name: 'Calm' }))
    expect(
      screen.getByRole('button', { name: 'Calm' }).getAttribute('aria-pressed'),
    ).toBe('true')
    fireEvent.change(screen.getByLabelText('Your thoughts'), {
      target: { value: '  A quiet day.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save journal' }))
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        date: '2026-10-18',
        entry: 'A quiet day.',
        mood: 'calm',
      }),
    )
    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/app/journal' })
  })

  it('hydrates an existing entry and updates by its stable ID', async () => {
    mocks.journal = {
      id: 'journal-one',
      entry: 'Yesterday was good.',
      mood: 'happy',
    }
    render(<JournalEditorScreen date="2026-10-17" />)
    expect(
      screen
        .getByRole('button', { name: 'Happy' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    expect(
      screen
        .getByRole('button', { name: 'Save changes' })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.change(screen.getByLabelText('Your thoughts'), {
      target: { value: 'Something to remember.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        journalId: 'journal-one',
        data: { entry: 'Something to remember.', mood: 'happy' },
      }),
    )
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('preserves text on a failed save and allows retry', async () => {
    mocks.create.mockRejectedValueOnce(new Error('Offline'))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    render(<JournalEditorScreen date="2026-10-18" />)
    fireEvent.change(screen.getByLabelText('Your thoughts'), {
      target: { value: 'Keep these words.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save journal' }))
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Failed to save journal entry'),
    )
    expect(screen.getByRole('textbox').getAttribute('maxlength')).toBe('5000')
    expect(screen.getByDisplayValue('Keep these words.')).toBeTruthy()
    expect(mocks.navigate).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('shows contextual skeletons without an editable blank entry during loading', () => {
    mocks.loading = true
    render(<JournalEditorScreen date="2026-10-18" />)
    expect(screen.getByRole('status', { name: 'Loading journal' })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save journal' })).toBeNull()
  })

  it('preserves confirmation before deleting an existing entry', async () => {
    mocks.journal = { id: 'journal-one', entry: 'My entry', mood: 'neutral' }
    render(<JournalEditorScreen date="2026-10-17" />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete journal entry' }),
    )
    await waitFor(() =>
      expect(mocks.remove).toHaveBeenCalledWith('journal-one'),
    )
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('prevents duplicate submission and mood changes while saving', () => {
    mocks.saving = true
    render(<JournalEditorScreen date="2026-10-18" />)
    expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Calm' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen
        .getByRole('button', { name: /Save journal/ })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('saves reviewed audio as journal text through the unchanged create contract', async () => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = () => 'blob:test'
        static revokeObjectURL = vi.fn()
      },
    )
    vi.spyOn(transcriptionAPI, 'create').mockResolvedValue({
      text: 'Spoken reflection.',
      language: 'eng',
    })
    render(<JournalEditorScreen date="2026-10-21" />)
    fireEvent.change(screen.getByLabelText('Your thoughts'), {
      target: { value: 'Written first.' },
    })
    fireEvent.change(screen.getByLabelText('Choose audio recording'), {
      target: {
        files: [new File(['audio'], 'note.m4a', { type: 'audio/mp4' })],
      },
    })
    await screen.findByLabelText('Review transcript')
    expect(mocks.create).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Add to text' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save journal' }))
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        date: '2026-10-21',
        entry: 'Written first.\n\nSpoken reflection.',
        mood: undefined,
      }),
    )
  })

  it('the older check-in sheet saves edited transcripts instead of only closing', async () => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = () => 'blob:test'
        static revokeObjectURL = vi.fn()
      },
    )
    vi.spyOn(transcriptionAPI, 'create').mockResolvedValue({
      text: 'A spoken check-in.',
      language: null,
    })
    const close = vi.fn()
    render(<JournalInsightSheet onClose={close} />)
    fireEvent.change(screen.getByLabelText('Choose audio recording'), {
      target: {
        files: [new File(['audio'], 'note.wav', { type: 'audio/wav' })],
      },
    })
    await screen.findByLabelText('Review transcript')
    fireEvent.click(screen.getByRole('button', { name: 'Add to text' }))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        entry: 'A spoken check-in.',
      }),
    )
    expect(close).toHaveBeenCalledOnce()
  })
})
