"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"
import { logoutAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, LogOut, ShieldCheck, UserCheck, Award } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  user: {
    nama: string
    email: string
    role: UserRole
    departmentName?: string | null
  }
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  )

  const roleLabel = {
    super_admin: "Super-Admin (Pimpinan)",
    admin: "Admin (SDM)",
    user: "Ketua Departemen",
  }[user.role]

  const roleIcon = {
    super_admin: <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
    admin: <UserCheck className="size-3.5 text-blue-600 dark:text-blue-400" />,
    user: <Award className="size-3.5 text-amber-600 dark:text-amber-400" />,
  }[user.role]

  const initials = user.nama
    ? user.nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Buka navigasi menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b border-border text-left">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-primary" />
                  <span className="size-2.5 rounded-full bg-secondary" />
                  <SheetTitle className="text-base font-bold">
                    Monitoring Dept
                  </SheetTitle>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  {roleIcon}
                  <span>{roleLabel}</span>
                </div>
              </SheetHeader>

              {/* Mobile Nav Links */}
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
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tema Tampilan</span>
                  <ThemeToggle />
                </div>
                <form action={logoutAction}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                    type="submit"
                  >
                    <LogOut className="size-4 mr-2" />
                    Keluar (Logout)
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-secondary" />
            <span className="font-bold text-sm tracking-tight">
              Monitoring Departemen
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/profil">
            <Avatar className="size-8 cursor-pointer ring-1 ring-border">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-primary" />
            <span className="size-3 rounded-full bg-secondary" />
            <h1 className="font-bold text-base tracking-tight">
              Monitoring Departemen
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sistem Penilaian Kinerja
          </p>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 ring-1 ring-border">
              <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.nama}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 font-normal bg-card border-border"
                >
                  {roleIcon}
                  <span className="ml-1 truncate">{user.role}</span>
                </Badge>
              </div>
            </div>
          </div>
          {user.departmentName && (
            <p className="text-xs text-muted-foreground mt-2 truncate bg-card p-1.5 rounded border border-border">
              🏢 {user.departmentName}
            </p>
          )}
        </div>

        {/* Desktop Nav Items */}
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
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mode Tampilan</span>
            <ThemeToggle />
          </div>
          <Separator />
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 justify-start"
              type="submit"
            >
              <LogOut className="size-4 mr-2" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
