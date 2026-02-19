import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type TabBarContextType = {
  isVisible: boolean
  show: () => void
  hide: () => void
  toggle: () => void
}

const TabBarContext = createContext<TabBarContextType | null>(null)

export const useTabBarController = () => {
  const ctx = useContext(TabBarContext)
  if (!ctx) throw new Error('TabBarProvider missing')
  return ctx
}

export const TabBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true)

  const show = useCallback(() => {
    setIsVisible(true)
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
  }, [])

  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({ isVisible, show, hide, toggle }),
    [isVisible, show, hide, toggle]
  )

  return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
}
