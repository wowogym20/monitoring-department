/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems, NAV_SECTION_LABELS, type NavSection } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"
import { Header } from "@/components/layout/header"
import { useSidebar } from "@/components/layout/sidebar-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { useUnreadComments } from "@/hooks/use-unread-comments"
import { Home, X } from "lucide-react"
import { AppFooter } from "@/components/layout/app-footer"

interface AppShellProps {
  children: React.ReactNode
  user: {
    nama: string
    email: string
    role: UserRole
    departmentName?: string | null
    fotoUrl?: string | null
  }
  appName?: string
  appTagline?: string
  logoUrl?: string
}

export function AppShell({
  children,
  user,
  appName = "Monitoring Departemen",
  appTagline = "Sistem Penilaian Kinerja",
  logoUrl = "/Logo.jpeg",
}: AppShellProps) {
  const pathname = usePathname()
  const {
    isCollapsed,
    mobileOpen,
    setMobileOpen,
    isTabletPortrait,
    tabletOpen,
    setTabletOpen,
  } = useSidebar()
  const { data: unreadCommentsCount = 0 } = useUnreadComments(user.role)

  const filteredNavItems = navigationItems
    .filter((item) => item.roles.includes(user.role))
    .map((item) => {
      if (user.role === "user" && (item.href === "/penilaian" || item.href === "/rekap")) {
        return {
          ...item,
          unreadCount: unreadCommentsCount,
        }
      }
      return item
    })

  const navSections: NavSection[] = ["main", "admin"]
  const groupedNavItems = navSections
    .map((section) => ({
      section,
      label: NAV_SECTION_LABELS[section],
      items: filteredNavItems.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0)

  // Kunci scroll body & tambahkan listener Escape ketika sidebar overlay tablet terbuka
  React.useEffect(() => {
    if (!isTabletPortrait || !tabletOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTabletOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isTabletPortrait, tabletOpen, setTabletOpen])

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground relative">
      {/* Backdrop Overlay khusus Tablet Portrait saat sidebar terbuka */}
      {isTabletPortrait && tabletOpen && (
        <div
          id="tablet-sidebar-backdrop"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300 cursor-pointer animate-in fade-in"
          onClick={() => setTabletOpen(false)}
          aria-label="Tutup sidebar"
          role="button"
          tabIndex={0}
        />
      )}

      {/* Mobile Navigation Sheet (Dapat dibuka via tombol hamburger di Header) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="h-16 px-4 border-b border-border flex flex-row items-center gap-3 space-y-0 text-left shrink-0">
            <div className="size-9 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs bg-muted/20 flex items-center justify-center">
              <img
                src={logoUrl || "/Logo.jpeg"}
                alt={appName}
                width={36}
                height={36}
                className="size-full object-cover aspect-square"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <SheetTitle className="text-sm font-bold tracking-tight leading-tight truncate">
                {appName}
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {appTagline}
              </p>
            </div>
          </SheetHeader>

          {/* Daftar Tautan Menu Mobile */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-3">
            {groupedNavItems.map((group, groupIdx) => (
              <div key={group.section} className="space-y-1">
                {groupedNavItems.length > 1 && (
                  <div
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase select-none",
                      groupIdx > 0 && "pt-2"
                    )}
                  >
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      title={item.title}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      />
                      <span className="flex-1 truncate text-left">{item.title}</span>
                      {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-orange-500 text-white shadow-xs"
                          )}
                        >
                          {item.unreadCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
                {groupedNavItems.length > 1 && groupIdx < groupedNavItems.length - 1 && (
                  <div className="pt-2">
                    <hr className="border-border/60" />
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Mobile Sheet: Navigasi ke Halaman Beranda di Bagian Bawah */}
          <div className="border-t border-border p-3 shrink-0">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              title="Halaman Beranda"
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                pathname === "/"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Home
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  pathname === "/" ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate text-left">Halaman Beranda</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop / Tablet Sidebar
          - Tablet portrait (768px-1024px portrait): Overlay posisi absolute di atas konten (tidak mendorong konten), z-index 50, tertutup default.
          - Desktop biasa: Normal flex flow, collapsible w-16 / w-64, sticky top-0.
      */}
      <aside
        id="app-sidebar"
        className={cn(
          "border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out",
          isTabletPortrait
            ? cn(
                "absolute top-0 left-0 bottom-0 min-h-full w-64 z-50 shadow-2xl",
                tabletOpen ? "flex translate-x-0" : "hidden -translate-x-full"
              )
            : cn(
                "hidden md:flex shrink-0 h-screen sticky top-0 z-20 transition-[width]",
                isCollapsed ? "w-16" : "w-64"
              )
        )}
        style={isTabletPortrait ? { position: "absolute" } : undefined}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 border-b border-border flex items-center shrink-0 transition-all duration-300",
            !isTabletPortrait && isCollapsed ? "justify-center px-2" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            onClick={() => {
              if (isTabletPortrait) setTabletOpen(false)
            }}
            className={cn(
              "flex items-center gap-3 min-w-0 rounded-md transition-colors",
              !isTabletPortrait && isCollapsed ? "justify-center p-1 hover:bg-muted" : "flex-1"
            )}
            title={appName}
          >
            <div
              className={cn(
                "rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs bg-muted/20 flex items-center justify-center",
                !isTabletPortrait && isCollapsed ? "size-8" : "size-9"
              )}
            >
              <img
                src={logoUrl || "/Logo.jpeg"}
                alt={appName}
                width={!isTabletPortrait && isCollapsed ? 32 : 36}
                height={!isTabletPortrait && isCollapsed ? 32 : 36}
                className="size-full object-cover aspect-square"
              />
            </div>
            {(!isCollapsed || isTabletPortrait) && (
              <div className="flex flex-col min-w-0 overflow-hidden">
                <h1 className="font-bold text-sm tracking-tight leading-tight truncate text-foreground">
                  {appName}
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {appTagline}
                </p>
              </div>
            )}
          </Link>

          {/* Tombol Close Sidebar Khusus Tablet Portrait */}
          {isTabletPortrait && (
            <button
              type="button"
              onClick={() => setTabletOpen(false)}
              className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-auto shrink-0 cursor-pointer"
              aria-label="Tutup sidebar"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Daftar Tautan Menu Desktop / Tablet */}
        <nav className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 overflow-x-hidden">
          {groupedNavItems.map((group, groupIdx) => (
            <div key={group.section} className="space-y-1">
              {groupedNavItems.length > 1 && (
                !isTabletPortrait && isCollapsed ? (
                  groupIdx > 0 ? (
                    <div className="py-1">
                      <div className="h-px w-8 mx-auto bg-border/80" />
                    </div>
                  ) : null
                ) : (
                  <div
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase select-none",
                      groupIdx > 0 && "pt-2"
                    )}
                  >
                    {group.label}
                  </div>
                )
              )}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => {
                      if (isTabletPortrait) setTabletOpen(false)
                    }}
                    title={item.title}
                    className={cn(
                      "flex items-center rounded-lg text-sm transition-colors relative cursor-pointer",
                      !isTabletPortrait && isCollapsed
                        ? "justify-center size-10 mx-auto"
                        : "gap-3 px-3 py-2.5 w-full",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-opacity duration-200",
                        !isTabletPortrait && isCollapsed ? "sr-only" : "flex-1 truncate text-left"
                      )}
                    >
                      {item.title}
                    </span>
                    {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                      !isTabletPortrait && isCollapsed ? (
                        <span
                          className="absolute top-1.5 right-1.5 size-2 bg-orange-500 rounded-full ring-2 ring-card"
                          aria-label={`${item.unreadCount} notifikasi belum dibaca`}
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-orange-500 text-white shadow-xs"
                          )}
                        >
                          {item.unreadCount}
                        </span>
                      )
                    )}
                  </Link>
                )
              })}
              {groupedNavItems.length > 1 && (!isCollapsed || isTabletPortrait) && groupIdx < groupedNavItems.length - 1 && (
                <div className="pt-2">
                  <hr className="border-border/60" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Sidebar: Navigasi ke Halaman Beranda di Bagian Bawah */}
        <div className="border-t border-border p-2 sm:p-3 shrink-0">
          <Link
            href="/"
            onClick={() => {
              if (isTabletPortrait) setTabletOpen(false)
            }}
            title="Halaman Beranda"
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors relative cursor-pointer",
              !isTabletPortrait && isCollapsed
                ? "justify-center size-10 mx-auto"
                : "gap-3 px-3 py-2.5 w-full",
              pathname === "/"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
            )}
          >
            <Home
              className={cn(
                "size-4 shrink-0 transition-colors",
                pathname === "/" ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "transition-opacity duration-200",
                !isTabletPortrait && isCollapsed ? "sr-only" : "flex-1 truncate text-left"
              )}
            >
              Halaman Beranda
            </span>
          </Link>
        </div>
      </aside>

      {/* Area Kanan: Header Global di Bagian Atas + Konten Halaman */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Header
          user={user}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  )
}

