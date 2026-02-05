import { PLATFORM } from '@/shared/constants.shared'

export function BottomNotch() {
  return PLATFORM == 'ios' && <div className="h-[var(--safe-area-inset-bottom)]"></div>
}

export function TopNotch() {
  return <div className="h-[var(--safe-area-inset-top)]"></div>
}

export function TopNotchPadd() {
  return <div className="pt-[var(--safe-area-inset-top)]"></div>
}
