import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = process.argv[2]
const version = process.argv[3] ?? 'v1'
if (!source || !/^v[1-9][0-9]*$/.test(version))
  throw new Error(
    'Usage: node scripts/pack-rewind-expressions.mjs <source-directory> [v1]',
  )
const partners = ['ella', 'lyra', 'jake', 'ariel', 'tobi', 'neeja']
const expressions = [
  'thinking',
  'typing',
  'cheering',
  'laughing',
  'surprised',
  'listening',
  'skeptical',
  'calm',
]
const parent = path.join(appRoot, 'public/assets/rewind/expressions')
const output = path.join(parent, version)
await mkdir(parent, { recursive: true })
// A new version must be a new directory; never replace an existing asset pack.
await mkdir(output)
const assets = []
for (const partner of partners) {
  const input = path.resolve(source, `${partner}-sheet.png`)
  const metadata = execFileSync(
    'sips',
    ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', input],
    { encoding: 'utf8' },
  )
  const width = Number(metadata.match(/pixelWidth: (\d+)/)?.[1])
  const height = Number(metadata.match(/pixelHeight: (\d+)/)?.[1])
  if (
    !width ||
    !height ||
    Math.abs(width / height - 2) > 0.03 ||
    !metadata.includes('hasAlpha: yes')
  )
    throw new Error(`${partner}: expected a transparent 4-column, 2-row atlas`)
  await mkdir(path.join(output, partner))
  for (const [index, expression] of expressions.entries()) {
    const left = Math.floor(((index % 4) * width) / 4)
    const top = Math.floor((Math.floor(index / 4) * height) / 2)
    const cropWidth = Math.floor((((index % 4) + 1) * width) / 4) - left
    const cropHeight =
      Math.floor(((Math.floor(index / 4) + 1) * height) / 2) - top
    const file = path.join(output, partner, `${expression}.webp`)
    // Deterministic atlas slicing and compression only; preserve generated alpha.
    execFileSync('cwebp', [
      '-quiet',
      '-q',
      '90',
      '-alpha_q',
      '100',
      '-m',
      '6',
      '-exact',
      '-crop',
      String(left),
      String(top),
      String(cropWidth),
      String(cropHeight),
      '-resize',
      '480',
      '480',
      input,
      '-o',
      file,
    ])
    assets.push({
      partner,
      expression,
      file: `/assets/rewind/expressions/${version}/${partner}/${expression}.webp`,
      bytes: (await readFile(file)).byteLength,
    })
  }
}
await writeFile(
  path.join(output, 'manifest.json'),
  `${JSON.stringify({ version, assets }, null, 2)}\n`,
  { flag: 'wx' },
)
console.log(
  `Packed ${assets.length} transparent expressions (${Math.round(assets.reduce((sum, asset) => sum + asset.bytes, 0) / 1024)} KiB) into ${output}`,
)
