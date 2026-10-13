"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { useSidebar } from "@/components/layout/sidebar-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { useUnreadComments } from "@/hooks/use-unread-comments"

interface AppShellProps {
  children: React.ReactNode
  user: {
    nama: string
    email: string
    role: UserRole
    departmentName?: string | null
    fotoUrl?: string | null
  }
}

export function AppShell({ children, user }: AppShellProps) {
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
            <Image
              src="/logo.png"
              alt="Logo Tazakka"
              width={36}
              height={36}
              className="size-9 object-contain shrink-0"
              priority
            />
            <div className="flex flex-col min-w-0">
              <SheetTitle className="text-sm font-bold tracking-tight leading-tight">
                Monitoring Departemen
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                Sistem Penilaian Kinerja
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{item.title}</span>
                  {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {item.unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
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
            title="Monitoring Departemen"
          >
            <Image
              src="/logo.png"
              alt="Logo Tazakka"
              width={isCollapsed ? 32 : 36}
              height={isCollapsed ? 32 : 36}
              className={cn(
                "object-contain shrink-0",
                isCollapsed ? "size-8" : "size-9"
              )}
              priority
            />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 overflow-hidden">
                <h1 className="font-bold text-sm tracking-tight leading-tight truncate text-foreground">
                  Monitoring Departemen
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  Sistem Penilaian Kinerja
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
                  "flex items-center rounded-md text-sm font-medium transition-all relative",
                  isCollapsed
                    ? "justify-center size-10 mx-auto"
                    : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    "transition-opacity duration-200",
                    isCollapsed ? "sr-only" : "flex-1 truncate"
                  )}
                >
                  {item.title}
                </span>
                {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                  isCollapsed ? (
                    <span
                      className="absolute top-2 right-2 size-2 bg-orange-500 rounded-full"
                      aria-label={`${item.unreadCount} notifikasi belum dibaca`}
                    />
                  ) : (
                    <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {item.unreadCount}
                    </span>
                  )
                )}
              </Link>
            )
          })}
        </nav>
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

