import { useEffect, useState } from 'react'

import { compositionKey } from '@/shared/flexx/flexx-design'
import type { FlexxDesign } from '@/shared/flexx/flexx-design'

const MAX_LIKES = 300

function readLikes(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (entry: unknown) => typeof entry === 'string' && entry.length < 1200,
      )
    )
      return []
    return parsed.slice(-MAX_LIKES)
  } catch (error: unknown) {
    console.warn('Unable to read saved Flexx likes', error)
    return []
  }
}

export function useFlexxLikes(userId: string | undefined): {
  isLiked: (design: FlexxDesign) => boolean
  toggleLike: (design: FlexxDesign) => void
} {
  const key = userId ? `vybaa:flexx:likes:v1:${userId}` : null
  const [saved, setSaved] = useState<{ key: string | null; likes: string[] }>(
    () => ({
      key,
      likes: key ? readLikes(key) : [],
    }),
  )
  useEffect(() => {
    setSaved({ key, likes: key ? readLikes(key) : [] })
    function onStorage(event: StorageEvent): void {
      if (event.key === key || event.key === null)
        setSaved({ key, likes: key ? readLikes(key) : [] })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  function isLiked(design: FlexxDesign): boolean {
    return saved.key === key && saved.likes.includes(compositionKey(design))
  }
  function toggleLike(design: FlexxDesign): void {
    if (!key) return
    const signature = compositionKey(design)
    const current = saved.key === key ? saved.likes : readLikes(key)
    const likes = current.includes(signature)
      ? current.filter((entry) => entry !== signature)
      : [...current, signature].slice(-MAX_LIKES)
    setSaved({ key, likes })
    try {
      window.localStorage.setItem(key, JSON.stringify(likes))
    } catch (error: unknown) {
      console.warn('Unable to persist Flexx likes on this device', error)
    }
  }
  return { isLiked, toggleLike }
}
