export const JOURNAL_PROMPTS = [
  "What made you smile today?",
  "What challenge did you overcome?",
  "What are you grateful for right now?",
  "What did you learn about yourself today?",
  "What are you looking forward to tomorrow?",
  "Who or what inspired you today?",
  "What would you like to let go of?",
  "What small win can you celebrate?",
  "What does your heart need right now?",
  "What brought you peace today?",
  "What are you proud of accomplishing?",
  "What emotion are you sitting with?",
  "What deserves your attention?",
  "What kindness did you experience?",
  "What's one thing you'd like to improve?",
  "What energy do you want to carry into tomorrow?",
  "What surprised you today?",
  "What pattern are you noticing in your life?",
  "What would make tomorrow even better?",
  "What do you need to forgive yourself for?",
  "What boundary did you honor today?",
  "What made you feel most alive?",
  "What conversation had an impact on you?",
  "What's weighing on your mind?",
  "What progress are you making, even if small?",
  "What does success look like for you today?",
  "What relationship are you nurturing?",
  "What habit are you building?",
  "What creative idea sparked in you?",
  "What does your future self need from you?",
]

/**
 * Get a daily prompt based on date
 * Same prompt for same date to maintain consistency
 */
export function getDailyPrompt(date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  const index = dayOfYear % JOURNAL_PROMPTS.length
  return JOURNAL_PROMPTS[index]
}

/**
 * Get a random prompt
 */
export function getRandomPrompt(): string {
  const index = Math.floor(Math.random() * JOURNAL_PROMPTS.length)
  return JOURNAL_PROMPTS[index]
}
