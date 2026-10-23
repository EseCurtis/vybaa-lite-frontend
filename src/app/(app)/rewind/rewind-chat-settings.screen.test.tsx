// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

import { http } from '@/shared/api/http'
import { rewindAPI } from '@/shared/api/rewind.api'
import RewindChatSettingsScreen from './rewind-chat-settings.screen'

const { navigate, toast, present, dismiss } = vi.hoisted(() => ({
  present: vi.fn<(content: ReactElement, options: { title: string }) => void>(),
  dismiss: vi.fn(),
  navigate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/hooks/use-bottom-sheet.hook', () => ({
  useBottomSheet: () => ({ present, dismiss }),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouter: () => ({
    history: { back: vi.fn(), canGoBack: () => false },
    navigate,
  }),
}))
vi.mock('@/components/common/tab-header.component', () => ({
  TabHeader: ({ title, onBack }: { title: string; onBack: () => void }) => (
    <header>
      <button onClick={onBack}>Back</button>
      <h1>{title}</h1>
    </header>
  ),
}))
vi.mock('@/providers/toast.provider', () => ({ useToast: () => toast }))
vi.mock('@/shared/utils/animation.util', () => ({ shouldAnimate: false }))
vi.mock('@/shared/api/http', () => ({ http: { get: vi.fn(), patch: vi.fn() } }))
vi.mock('@/shared/api/rewind.api', () => ({
  rewindAPI: { clearV2Chat: vi.fn(), renameV2Chat: vi.fn() },
}))

const settings = {
  id: 'chat-1',
  title: 'The group',
  type: 'GROUP',
  personaId: null,
  accentColor: 'rose',
  proactiveMuted: false,
  conversationMood: { energy: 50, playfulness: 50, directness: 50 },
}
let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.mocked(http.get).mockResolvedValue({ data: { data: settings } })
  vi.mocked(http.patch).mockResolvedValue({ data: {} })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})

function showSettings(): void {
  render(
    <QueryClientProvider client={client}>
      <RewindChatSettingsScreen chatId="chat-1" />
    </QueryClientProvider>,
  )
}

it('saves the chat tone and color when Save is pressed', async () => {
  showSettings()
  const energy = await screen.findByRole('slider', { name: 'Energy' })
  fireEvent.change(energy, { target: { value: '80' } })
  fireEvent.click(screen.getByRole('button', { name: 'Teal chat color' }))
  expect(http.patch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await waitFor(() =>
    expect(http.patch).toHaveBeenCalledWith(
      '/api/v2/rewind/chats/chat-1/preferences',
      {
        accentColor: 'teal',
        conversationMood: { energy: 80, playfulness: 50, directness: 50 },
      },
    ),
  )
})

it('keeps slider changes when saving fails and displays a retryable error', async () => {
  vi.mocked(http.patch).mockRejectedValue(new Error('Offline'))
  showSettings()
  const energy = await screen.findByRole('slider', { name: 'Energy' })
  fireEvent.change(energy, { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await screen.findByRole('alert')
  expect(energy.getAttribute('aria-valuetext')).toContain('20 percent')
  expect(
    screen
      .getByRole('button', { name: 'Save changes' })
      .hasAttribute('disabled'),
  ).toBe(false)
})

it('hides group naming in a direct chat and goes back to that chat', async () => {
  vi.mocked(http.get).mockResolvedValue({
    data: {
      data: { ...settings, type: 'PARTNER', title: 'Ella', personaId: 'ella' },
    },
  })
  showSettings()
  await screen.findByRole('slider', { name: 'Energy' })
  expect(screen.queryByLabelText('Group name')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Edit group name' })).toBeNull()
  expect(
    screen.queryByRole('switch', { name: 'Partners can start a chat' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(navigate).toHaveBeenCalledWith({
    to: '/app/rewind-chat/chat-1',
    replace: true,
  })
})

it('does not clear messages when confirmation is declined', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  showSettings()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Clear every chat message' }),
  )
  expect(rewindAPI.clearV2Chat).not.toHaveBeenCalled()
})

it('previews colors immediately and resets unsaved preferences without a request', async () => {
  showSettings()
  const energy = await screen.findByRole('slider', { name: 'Energy' })
  fireEvent.change(energy, { target: { value: '75' } })
  fireEvent.click(screen.getByRole('button', { name: 'Blue chat color' }))
  expect(screen.getByTestId('chat-color-preview').style.backgroundColor).toBe(
    'rgb(49, 107, 199)',
  )
  expect(
    screen
      .getByRole('button', { name: 'Blue chat color' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  fireEvent.click(
    screen.getByRole('button', { name: 'Discard preference changes' }),
  )
  expect(energy.getAttribute('aria-valuetext')).toContain('50 percent')
  expect(
    screen
      .getByRole('button', { name: 'Rose chat color' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  expect(
    screen
      .getByRole('button', { name: 'Save changes' })
      .hasAttribute('disabled'),
  ).toBe(true)
  expect(http.patch).not.toHaveBeenCalled()
})

it('submits a group name once through the form', async () => {
  vi.mocked(rewindAPI.renameV2Chat).mockResolvedValue({
    data: { title: 'New group name' },
    msg: 'Updated',
  })
  showSettings()
  expect(screen.queryByLabelText('Group name')).toBeNull()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit group name' }),
  )
  const [content, options] = present.mock.calls[0]
  expect(options.title).toBe('Group name')
  render(<QueryClientProvider client={client}>{content}</QueryClientProvider>)
  const input = screen.getByLabelText('Group name')
  fireEvent.change(input, { target: { value: 'New group name' } })
  const form = input.closest('form')
  if (!form) throw new Error('Group name form missing')
  fireEvent.submit(form)
  await waitFor(() => expect(rewindAPI.renameV2Chat).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(dismiss).toHaveBeenCalledTimes(1))
  expect(http.patch).not.toHaveBeenCalled()
})

it('retains the rename draft on failure and retries through Save', async () => {
  vi.mocked(rewindAPI.renameV2Chat)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ data: { title: 'My people' }, msg: 'Updated' })
  showSettings()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit group name' }),
  )
  render(
    <QueryClientProvider client={client}>
      {present.mock.calls[0][0]}
    </QueryClientProvider>,
  )
  const input = screen.getByLabelText<HTMLInputElement>('Group name')
  fireEvent.change(input, { target: { value: 'My people' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save group name' }))
  await screen.findByText('Offline')
  expect(input.value).toBe('My people')
  expect(dismiss).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Save group name' }))
  await waitFor(() => expect(dismiss).toHaveBeenCalledTimes(1))
  expect(rewindAPI.renameV2Chat).toHaveBeenCalledTimes(2)
})
