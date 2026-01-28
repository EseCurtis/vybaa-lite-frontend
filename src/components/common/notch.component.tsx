import { PLATFORM } from '@/shared/constants.shared'

export function BottomNotch() {
  return PLATFORM == 'ios' && <div className="h-7"></div>
}

export function TopNotch() {
  return <div className="h-[var(--statusbar-clearfix)]"></div>
}

export function TopNotchPadd() {
  return <div className="pt-[var(--statusbar-clearfix)]"></div>
}
