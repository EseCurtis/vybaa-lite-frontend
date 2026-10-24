function seededUnit(seed: string): number {
  let hash = 2166136261
  for (const character of seed)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return (hash >>> 0) / 4294967296
}

export function reflectionClusterPosition(
  seed: string,
  index: number,
  count: number,
): { left: number; top: number; size: number; rotation: number } {
  const phase = seededUnit(`${seed}:phase`) * Math.PI * 2
  const jitter = (seededUnit(`${seed}:${index}:angle`) - 0.5) * 0.2
  const angle = phase + (index / Math.max(1, count)) * Math.PI * 2 + jitter
  const size = 26 + seededUnit(`${seed}:${index}:size`) * 4
  const radius = 28 + seededUnit(`${seed}:${index}:radius`)
  return {
    left: 44 + Math.cos(angle) * radius - size / 2,
    top: 44 + Math.sin(angle) * radius - size / 2,
    size,
    rotation: (seededUnit(`${seed}:${index}:rotation`) - 0.5) * 16,
  }
}
