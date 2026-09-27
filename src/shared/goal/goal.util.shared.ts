import { quickGoalSuggestions } from "./goal.constants.shared";



export function randomCreateGoalPlaceholder(): string {
  const presetPlaceholders = quickGoalSuggestions

  const currentMinute = Math.floor(Date.now() / 60_000);

  let hash = currentMinute;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;

  const randomIndex = Math.abs(hash) % presetPlaceholders.length;

  return presetPlaceholders[randomIndex] ?? presetPlaceholders[0];
}

export function randomGreetings(username?: string): string {
  const name = username?.trim() || 'there';

  const greetings = [
    `Ready, ${name}?`,
    `What’s the goal, ${name}?`,
    `Let’s begin, ${name}.`,
    `What’s next, ${name}?`,
    `Set a goal, ${name}.`,
    `Make progress, ${name}.`,
    `Let’s do this, ${name}.`,
    `Start small, ${name}.`,
  ];

  const minute = Math.floor(Date.now() / 60_000);

  let hash = minute;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;

  return greetings[(hash >>> 0) % greetings.length];
}