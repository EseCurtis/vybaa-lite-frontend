import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import CreateGoalScreen from '@/app/(goal)/create.screen'
import GoalDetailScreen from '@/app/(goal)/detail.screen'
import RewindChatScreen from '@/app/(app)/rewind/rewind-chat.screen'
import RewindChatsScreen from '@/app/(app)/rewind/rewind-chats.screen'
import RewindSessionArchiveScreen from '@/app/(app)/rewind/rewind-session-archive.screen'
import RewindSessionDetailScreen from '@/app/(app)/rewind/rewind-session-detail.screen'
import '@/styles.css'
import { day, post, slide } from './fixtures'

sessionStorage.setItem(
  'rewind:goal-recommendation',
  JSON.stringify({
    initialStep: slide.step,
    values: {
      title: post.goal.title,
      description: post.goal.reason,
      target: { type: 'CHECK_IN_COUNT', count: 7 },
      schedule: { type: 'DAILY', startDate: day },
      reminderTimes: [post.goal.reminder],
    },
  }),
)
const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
function Screen() {
  if (slide.screen === 'goal-create') return <CreateGoalScreen />
  if (slide.screen === 'goal-detail') return <GoalDetailScreen />
  if (slide.screen === 'conversations') return <RewindChatsScreen />
  if (slide.screen === 'reflections') return <RewindSessionArchiveScreen />
  if (slide.screen === 'reflection-detail')
    return <RewindSessionDetailScreen origin="history" />
  return <RewindChatScreen chatId="capture-chat" />
}
const root = document.getElementById('app')
if (!root) throw new Error('Capture mount missing')
root.style.cssText =
  'display:flex;flex-direction:column;position:relative;--safe-area-inset-top:0px;--safe-area-inset-bottom:0px'
root.className = 'text-white'
createRoot(root).render(
  <QueryClientProvider client={client}>
    <div
      style={{
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        background: '#0A0E16',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: 600,
        fontSize: 15,
      }}
    >
      <span>{slide.screen.startsWith('reflection') ? '10:00' : '7:59'}</span>
      <svg
        width="67"
        height="16"
        viewBox="0 0 67 16"
        aria-label="Cellular, Wi-Fi and battery"
      >
        <path
          fill="white"
          d="M0 12h3v3H0zm5-3h3v6H5zm5-3h3v9h-3zm5-3h3v12h-3z"
        />
        <path
          d="M24 6q8-7 16 0m-13 3q5-5 10 0m-7 3q2-2 4 0"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="44"
          y="3"
          width="20"
          height="11"
          rx="3"
          fill="none"
          stroke="white"
        />
        <rect x="46" y="5" width="14" height="7" rx="1" fill="white" />
        <path d="M66 6v5" stroke="white" />
      </svg>
    </div>
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <Screen />
    </div>
    <div
      style={{
        height: 25,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0E16',
      }}
    >
      <div
        style={{ width: 134, height: 5, borderRadius: 4, background: '#fff' }}
      />
    </div>
  </QueryClientProvider>,
)
