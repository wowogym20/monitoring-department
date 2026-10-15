/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/components/layout/nav-items"
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
import { Home } from "lucide-react"

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
  const { isCollapsed, mobileOpen, setMobileOpen } = useSidebar()
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
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
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

      {/* Desktop Sidebar (Khusus Brand & Menu Navigasi - Collapsible) */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card shrink-0 h-screen sticky top-0 transition-[width] duration-300 ease-in-out z-20",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 border-b border-border flex items-center shrink-0 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 min-w-0 rounded-md transition-colors",
              isCollapsed ? "justify-center p-1 hover:bg-muted" : "w-full"
            )}
            title={appName}
          >
            <div
              className={cn(
                "rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs bg-muted/20 flex items-center justify-center",
                isCollapsed ? "size-8" : "size-9"
              )}
            >
              <img
                src={logoUrl || "/Logo.jpeg"}
                alt={appName}
                width={isCollapsed ? 32 : 36}
                height={isCollapsed ? 32 : 36}
                className="size-full object-cover aspect-square"
              />
            </div>
            {!isCollapsed && (
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
        </div>

        {/* Daftar Tautan Menu Desktop */}
        <nav className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 overflow-x-hidden">
          {filteredNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors relative cursor-pointer",
                  isCollapsed
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
                    isCollapsed ? "sr-only" : "flex-1 truncate text-left"
                  )}
                >
                  {item.title}
                </span>
                {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                  isCollapsed ? (
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
        </nav>

        {/* Footer Sidebar: Navigasi ke Halaman Beranda di Bagian Bawah */}
        <div className="border-t border-border p-2 sm:p-3 shrink-0">
          <Link
            href="/"
            title="Halaman Beranda"
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors relative cursor-pointer",
              isCollapsed
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
                isCollapsed ? "sr-only" : "flex-1 truncate text-left"
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

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

