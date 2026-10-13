"use client"

import * as React from "react"

export const SIDEBAR_COOKIE_NAME = "sidebar_state"
export const SIDEBAR_PREF_COOKIE = "sidebar_custom_pref"
export const TABLET_PORTRAIT_QUERY =
  "(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"

export interface SidebarContextValue {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  toggleSidebar: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  toggleMobile: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export interface SidebarProviderProps {
  children: React.ReactNode
  initialCollapsed?: boolean
  hasUserPreference?: boolean
}

function setCookie(name: string, value: string, maxAgeSeconds = 31536000) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

export function SidebarProvider({
  children,
  initialCollapsed = false,
  hasUserPreference: initialHasUserPreference = false,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const hasUserPrefRef = React.useRef(initialHasUserPreference)

  // Sinkronisasi dengan localStorage jika cookie tidak terbaca di SSR (fallback)
  React.useEffect(() => {
    try {
      const storedPref = localStorage.getItem(SIDEBAR_PREF_COOKIE)
      const storedState = localStorage.getItem(SIDEBAR_COOKIE_NAME)

      if (storedPref === "true" || storedState) {
        hasUserPrefRef.current = true
        if (storedState === "collapsed") {
          setTimeout(() => setIsCollapsed(true), 0)
        } else if (storedState === "expanded") {
          setTimeout(() => setIsCollapsed(false), 0)
        }
      }
    } catch {
      // Abaikan jika localStorage tidak diizinkan atau tidak didukung
    }
  }, []) // Hanya dieksekusi sekali saat client mount

  // Perilaku responsif Tablet Portrait (hanya jika pengguna belum pernah memilih secara manual)
  React.useEffect(() => {
    // Jika pengguna sudah memiliki preferensi tersimpan, jangan override
    if (hasUserPrefRef.current) return
    if (typeof window === "undefined" || !window.matchMedia) return

    const mediaQuery = window.matchMedia(TABLET_PORTRAIT_QUERY)

    // Evaluasi awal saat browser mount
    if (mediaQuery.matches) {
      setTimeout(() => setIsCollapsed(true), 0)
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (!hasUserPrefRef.current) {
        setIsCollapsed(e.matches)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  const setCollapsedState = React.useCallback(
    (action: boolean | ((prev: boolean) => boolean)) => {
      setIsCollapsed((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        hasUserPrefRef.current = true
        const stateStr = next ? "collapsed" : "expanded"

        // Simpan ke cookie (1 tahun) untuk SSR render berikutnya tanpa flicker
        setCookie(SIDEBAR_COOKIE_NAME, stateStr)
        setCookie(SIDEBAR_PREF_COOKIE, "true")

        // Fallback simpan ke localStorage
        try {
          localStorage.setItem(SIDEBAR_COOKIE_NAME, stateStr)
          localStorage.setItem(SIDEBAR_PREF_COOKIE, "true")
        } catch {
          // localStorage disabled
        }

        return next
      })
    },
    []
  )

  const toggleSidebar = React.useCallback(() => {
    setCollapsedState((prev) => !prev)
  }, [setCollapsedState])

  const toggleMobile = React.useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed: setCollapsedState,
      toggleSidebar,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
    }),
    [isCollapsed, setCollapsedState, toggleSidebar, mobileOpen, toggleMobile]
  )

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar harus digunakan di dalam SidebarProvider")
  }
  return context
}
