import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const [first, second, destination] = process.argv.slice(2)
if (!first || !second || !destination)
  throw new Error(
    'Usage: node pack-achievement-badges.mjs sheet1.png sheet2.png destination',
  )
const keys = [
  'streak_milestone-3',
  'streak_milestone-7',
  'streak_milestone-14',
  'streak_milestone-21',
  'streak_milestone-30',
  'streak_milestone-50',
  'streak_milestone-100',
  'streak_milestone-365',
  'total_goals-3',
  'total_goals-5',
  'total_goals-10',
  'total_checkins-50',
  'total_checkins-100',
  'total_checkins-200',
  'total_checkins-500',
  'perfect_week-1',
  'comeback-1',
  'early_bird-1',
  'night_owl-1',
  'signature',
]
mkdirSync(destination, { recursive: false })
const assets = []
for (const [batch, source] of [first, second].entries()) {
  const info = execFileSync(
    'sips',
    ['-g', 'pixelWidth', '-g', 'pixelHeight', source],
    { encoding: 'utf8' },
  )
  const width = Number(info.match(/pixelWidth: (\d+)/)?.[1])
  const height = Number(info.match(/pixelHeight: (\d+)/)?.[1])
  if (!width || !height) throw new Error('Missing image dimensions')
  const size = Math.floor(Math.min(width / 5, height / 2))
  for (let cell = 0; cell < 10; cell++) {
    const left = Math.floor(((cell % 5) * width) / 10) * 2
    const top = Math.floor((Math.floor(cell / 5) * height) / 4) * 2
    const key = keys[batch * 10 + cell]
    const filename = `${key}.webp`
    execFileSync('cwebp', [
      '-quiet',
      '-q',
      '92',
      '-alpha_q',
      '100',
      '-m',
      '4',
      '-crop',
      String(left),
      String(top),
      String(size),
      String(size),
      source,
      '-o',
      path.join(destination, filename),
    ])
    assets.push({ key, filename, batch: batch + 1, crop: { left, top, size } })
  }
}
writeFileSync(
  path.join(destination, 'manifest.json'),
  JSON.stringify({ version: 1, assets }, null, 2),
  { flag: 'wx' },
)
