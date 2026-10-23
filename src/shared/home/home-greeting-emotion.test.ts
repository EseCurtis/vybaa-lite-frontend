import { describe, expect, it } from 'vitest'

import { homeGreetingEmotion } from './home-greeting-emotion'

describe('Home greeting expressions', () => {
  it.each([
    ['You completed your task. Proud of you!', 'cheering'],
    ['You protected your time today', 'cheering'],
    ['You seem overwhelmed. I’m here for you 😂', 'listening'],
    ['No progress today? We can start again 🎉', 'listening'],
    ['You haven’t finished yet. That’s okay.', 'listening'],
    ['I missed you a bit 😭', 'listening'],
    ['Still alive? Cool. Come gist me 😂', 'laughing'],
    ['Be honest. What are you avoiding?', 'skeptical'],
    ['I’m here for you. We’ll sort it out.', 'love'],
    ['How are you really feeling?', 'thinking'],
    ['Something unexpected 😮', 'surprised'],
    [':vybaa/ella/thinking:', 'thinking'],
    ['Hey friend.', 'listening'],
  ])('matches the displayed message: %s', (message, expected) => {
    expect(homeGreetingEmotion(message)).toBe(expected)
  })

  it('considers both visible fallback lines without changing the greeting', () => {
    expect(
      homeGreetingEmotion('You’ve got this, Ese.', 'One step today.', '💪'),
    ).toBe('cheering')
    expect(
      homeGreetingEmotion(
        'Come talk when you can',
        'I noticed something',
        '👀',
      ),
    ).toBe('thinking')
    expect(homeGreetingEmotion('Hey', '', '😂')).toBe('laughing')
  })
})
