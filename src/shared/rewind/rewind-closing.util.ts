export interface RewindClosingPlaybackState {
  activeSourceCount: number
  acknowledgementSent: boolean
  closing: boolean
  playingQueue: boolean
  queuedChunkCount: number
  turnComplete: boolean
}

export function shouldAcknowledgeRewindClosing(
  state: RewindClosingPlaybackState,
): boolean {
  return (
    state.closing &&
    state.turnComplete &&
    !state.acknowledgementSent &&
    !state.playingQueue &&
    state.activeSourceCount === 0 &&
    state.queuedChunkCount === 0
  )
}
