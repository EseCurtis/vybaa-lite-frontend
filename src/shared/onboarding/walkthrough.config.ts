export type WalkthroughStep = {
  description: string
  selector: string
  title: string
}
export type WalkthroughDefinition = { id: string; steps: WalkthroughStep[] }

export const WALKTHROUGHS: Record<string, WalkthroughDefinition> = {
  '/app/home': {
    id: 'home-main',
    steps: [
      {
        title: 'Your everyday tasks',
        selector: '[data-testid="home-action-my-tasks"]',
        description:
          'Open your task list here. Search, check in, or continue a draft without turning the day into a dashboard.',
      },
      {
        title: 'A moment to Rewind',
        selector: '[data-testid^="home-action-rewind"]',
        description:
          'Your partner has questions for your day. Choose an answer or write your own. Your schedule can be flexible too.',
      },
      {
        title: 'Your main spaces',
        selector: '[data-walkthrough="main-navigation"]',
        description:
          'Home, Flexx, the centre plus for a task, Rewind Chats, and Profile. Journal and About you live in Profile.',
      },
    ],
  },
  '/app/goal': {
    id: 'goals-library',
    steps: [
      {
        title: 'Create or continue a task',
        selector: '[data-testid="goal-create-button"]',
        description:
          'The plus starts a task. A pencil and dot mean your unfinished draft is waiting.',
      },
      {
        title: 'One list, different views',
        selector: '[data-walkthrough="goal-library-tabs"]',
        description:
          'Switch between Active, Paused, History and Archived. Search stays above the list; Back returns to where you came from.',
      },
    ],
  },
  '/app/goal/create': {
    id: 'goal-creation',
    steps: [
      {
        title: 'One decision at a time',
        selector: '[data-walkthrough="goal-creation-progress"]',
        description:
          'Name the task, choose how to track it, and set a routine. Check the details before you create it.',
      },
      {
        title: 'Keep it doable',
        selector: '[data-walkthrough="goal-definition-fields"]',
        description:
          'Start with a clear action. Add a reason if it helps; you can shape the other details as you go.',
      },
      {
        title: 'A draft with your partner',
        selector: '[data-testid="quick-goal-setup-button"]',
        description:
          'AI quick setup can prepare a task for you to check and edit. Nothing is created until you confirm.',
      },
    ],
  },
  '/app/profile': {
    id: 'profile-main',
    steps: [
      {
        title: 'Your Vybaa identity',
        selector: '[data-walkthrough="profile-identity"]',
        description:
          'Edit your photo, name or username here. Your identity stays consistent throughout the app.',
      },
      {
        title: 'The things that are yours',
        selector: '[data-walkthrough="profile-quick-actions"]',
        description:
          'Open Journal, About you, Play Points, achievements and settings. About you lets you change or remove your onboarding answers.',
      },
    ],
  },
  '/app/rewind': {
    id: 'rewind-main',
    steps: [
      {
        title: 'Your daily Rewind',
        selector: '[data-walkthrough="rewind-questionnaire"]',
        description:
          'Answer the cards at your own pace. Pick a suggestion or use your own words. The countdown shows when your next scheduled Rewind is due.',
      },
      {
        title: 'Keep talking',
        selector: '[aria-label="Open Rewind text chats"]',
        description:
          'Open a private conversation or the group room. Available partners can reply, and you control proactive check-ins.',
      },
      {
        title: 'Choose your perspective',
        selector: '[aria-label^="Change Rewind partner"]',
        description:
          'Choose the partner who feels right for you. You can see availability and any switching limits before making a change.',
      },
    ],
  },
  '/app/rewind-chats': {
    id: 'rewind-discussions',
    steps: [
      {
        title: 'Your conversations',
        selector: '[data-walkthrough="discussion-intro"]',
        description:
          'Open a one-to-one chat or the group room. Partners can bring something up too; you can mute that in each conversation’s settings.',
      },
      {
        title: 'Chats have their own tab',
        selector: '[data-testid="tab-rewind-chats"]',
        description:
          'Come back to these conversations here. Your daily Rewind is separate and opens from Home.',
      },
    ],
  },
  '/app/actions/flexx': {
    id: 'flexx-feed',
    steps: [
      {
        title: 'A feed with room for you',
        selector: '[aria-label="Your Flexx feed"]',
        description:
          'Swipe up for partner posts, real activity moments and questions. Answers you choose to submit can contribute to today’s reflection.',
      },
      {
        title: 'Change the mix',
        selector: '[aria-label^="Choose Flexx filter"]',
        description:
          'Keep a mixed feed or open a category. Empty stats stay out of the feed; your partners won’t invent progress.',
      },
      {
        title: 'Keep or share a moment',
        selector: '[aria-label$="Flexx actions"]',
        description:
          'Like a post or share it using the controls on the right. Music starts only if you turn it on.',
      },
    ],
  },
}

const CONVERSATION: WalkthroughDefinition = {
  id: 'rewind-conversation',
  steps: [
    {
      title: 'Back to your conversations',
      selector: '[data-testid="tab-header-back"]',
      description:
        'Use Back, or swipe from the left edge, to return to the conversation list.',
    },
    {
      title: 'Talk in your own way',
      selector: '[aria-label="Message your Rewind partners"]',
      description:
        'Type naturally. Use the sticker grid for partner expressions, or @ to address someone in a group. Recently used stickers come first.',
    },
    {
      title: 'Just this conversation',
      selector: '[aria-label="Chat settings"]',
      description:
        'Adjust this chat’s colour, tone and proactive check-ins. In a group, the pen beside the name lets you rename the room.',
    },
  ],
}

const TASK_DETAIL: WalkthroughDefinition = {
  id: 'task-details',
  steps: [
    {
      title: 'What matters today',
      selector: '[aria-label="Task overview"]',
      description:
        'See progress and the next due date. Check in opens an entry form; Subtasks opens its own sheet.',
    },
    {
      title: 'History and rewards, when you need them',
      selector: '[aria-label="Task details sections"]',
      description:
        'Timeline opens your task history. Rewards separates Play Points already added from those still pending. There is no extra review form.',
    },
  ],
}

export function getWalkthroughDefinition(
  pathname: string,
): WalkthroughDefinition | null {
  const path = pathname.replace(/\/$/, '')
  if (WALKTHROUGHS[path]) return WALKTHROUGHS[path]
  if (/^\/app\/rewind-chat\/[^/]+$/.test(path)) return CONVERSATION
  if (/^\/app\/goal\/[^/]+$/.test(path)) return TASK_DETAIL
  return null
}
