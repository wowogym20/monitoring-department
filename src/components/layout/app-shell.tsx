"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"
import Image from "next/image"
import { Header } from "@/components/layout/header"
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
  const [mobileOpen, setMobileOpen] = React.useState(false)

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

      {/* Desktop Sidebar (Khusus Brand & Menu Navigasi) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0">
        {/* Brand Header (Tinggi h-16 sejajar dengan list bottom header app) */}
        <div className="h-16 px-4 border-b border-border flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Logo Tazakka"
            width={36}
            height={36}
            className="size-9 object-contain shrink-0"
            priority
          />
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-sm tracking-tight leading-tight truncate">
              Monitoring Departemen
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              Sistem Penilaian Kinerja
            </p>
          </div>
        </div>

        {/* Daftar Tautan Menu Desktop */}
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
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
