import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const messagePath = process.argv[2]

if (!messagePath) {
  process.exit(0)
}

const existingMessage = readFileSync(messagePath, 'utf8')
const hasMessage = existingMessage
  .split('\n')
  .some((line) => line.trim() && !line.trim().startsWith('#'))

if (hasMessage || !process.env.GEMINI_API_KEY) {
  process.exit(0)
}

const stagedDiff = execFileSync('git', ['diff', '--cached', '--no-ext-diff'], {
  encoding: 'utf8',
  maxBuffer: 1_000_000,
})

if (!stagedDiff.trim()) {
  process.exit(0)
}

const diffLimit = Number(process.env.GEMINI_COMMIT_MESSAGE_DIFF_LIMIT ?? 20000)
const prompt = [
  'Generate one concise Git commit subject for the staged changes below.',
  'Use imperative mood, keep it under 72 characters, and do not include quotes, markdown, or a period.',
  'Prefer a conventional-commit prefix such as feat:, fix:, refactor:, docs:, test:, chore:, or build: when appropriate.',
  '',
  stagedDiff.slice(0, diffLimit),
].join('\n')

try {
  const model = process.env.GEMINI_COMMIT_MESSAGE_MODEL ?? 'gemini-2.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 40 },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`)
  }

  const payload = await response.json()
  const generatedMessage = payload.candidates?.[0]?.content?.parts
    ?.find((part) => typeof part.text === 'string')
    ?.text?.replace(/[`\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!generatedMessage) {
    throw new Error('Gemini API returned no commit message')
  }

  writeFileSync(messagePath, `${generatedMessage}\n\n${existingMessage}`)
} catch (error) {
  console.warn(
    `AI commit message generation skipped: ${error instanceof Error ? error.message : String(error)}`,
  )
}
