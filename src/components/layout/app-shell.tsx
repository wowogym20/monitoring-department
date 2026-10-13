"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/layout/sidebar-context"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar()

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  )

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
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-l-4 border-emerald-600 font-semibold"
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
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {isCollapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center justify-center p-1 rounded-md hover:bg-muted transition-colors"
              title="Monitoring Departemen - Halaman Utama"
            >
              <Image
                src="/logo.png"
                alt="Logo Tazakka"
                width={32}
                height={32}
                className="size-8 object-contain shrink-0"
                priority
              />
            </Link>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src="/logo.png"
                  alt="Logo Tazakka"
                  width={36}
                  height={36}
                  className="size-9 object-contain shrink-0"
                  priority
                />
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <h1 className="font-bold text-sm tracking-tight leading-tight truncate">
                    Monitoring Departemen
                  </h1>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate">
                    Sistem Penilaian Kinerja
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="size-8 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                aria-label="Tutup sidebar"
                aria-expanded={true}
                title="Tutup sidebar"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          )}
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
                  "flex items-center rounded-md text-sm font-medium transition-colors relative",
                  isCollapsed
                    ? "justify-center size-10 mx-auto"
                    : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-l-4 border-emerald-600 font-semibold"
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

        {/* Footer Sidebar: Tombol Toggle Collapse Bawah */}
        <div className="border-t border-border p-2 shrink-0">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground transition-all rounded-md",
              isCollapsed
                ? "justify-center size-10 mx-auto px-0"
                : "justify-start gap-3 px-3 h-9"
            )}
            aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                <span className="text-xs font-medium truncate">Ciutkan Sidebar</span>
              </>
            )}
          </Button>
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

