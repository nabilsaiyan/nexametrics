import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  openMobile: () => void
  closeMobile: () => void
}

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => {},
  openMobile: () => {},
  closeMobile: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    return stored === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}
