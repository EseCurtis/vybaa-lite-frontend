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

import { http } from '@/shared/api/http'
import { rewindAPI } from '@/shared/api/rewind.api'
import RewindChatSettingsScreen from './rewind-chat-settings.screen'

const { navigate, toast } = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
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

it('only saves mood and the initiation switch when Save is pressed', async () => {
  showSettings()
  const energy = await screen.findByRole('slider', { name: 'Energy' })
  fireEvent.change(energy, { target: { value: '80' } })
  fireEvent.click(
    screen.getByRole('switch', { name: 'Partners can start a chat' }),
  )
  expect(http.patch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Save chat preferences' }))
  await waitFor(() =>
    expect(http.patch).toHaveBeenCalledWith(
      '/api/v2/rewind/chats/chat-1/preferences',
      {
        proactiveMuted: true,
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
  fireEvent.click(screen.getByRole('button', { name: 'Save chat preferences' }))
  await screen.findByRole('alert')
  expect(energy.getAttribute('aria-valuetext')).toContain('20 percent')
  expect(
    screen
      .getByRole('button', { name: 'Save chat preferences' })
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
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(navigate).toHaveBeenCalledWith({
    to: '/app/rewind-chat/$chatId',
    params: { chatId: 'chat-1' },
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
