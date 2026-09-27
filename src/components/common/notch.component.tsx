
export function BottomNotch() {
  return <div className="h-[var(--safe-area-inset-bottom)]"></div>
}

export function BottomNotchWithTab() {
  return <div className="pb-[calc(var(--safe-area-inset-bottom)+100px)]"></div>
}

export function BottomNotchPadd() {
  return <div className="pb-[var(--safe-area-inset-bottom)]"></div>
}

export function TopNotch() {
  return <div className="h-[var(--safe-area-inset-top)]"></div>
}

export function TopNotchPadd() {
  return <div className="pt-[var(--safe-area-inset-top)]"></div>
}
