export function freezeFlexxForExport(clone: Document): void {
  for (const root of clone.querySelectorAll('[data-flexx-animate]'))
    root.setAttribute('data-flexx-animate', 'false')
  for (const element of clone.querySelectorAll<HTMLElement>(
    '[data-flexx-loop]',
  )) {
    element.style.setProperty('animation', 'none', 'important')
    element.style.setProperty('transform', 'none', 'important')
  }
}
