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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSidebar } from "@/components/layout/sidebar-context"
import {
  Menu,
  LogOut,
  ShieldCheck,
  UserCheck,
  Award,
  User as UserIcon,
  ChevronDown,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import Image from "next/image"

export interface HeaderProps {
  user: {
    nama: string
    email: string
    role: UserRole
    departmentName?: string | null
    fotoUrl?: string | null
  }
  onMobileMenuToggle?: () => void
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar()

  // Dapatkan judul halaman aktif untuk breadcrumb desktop & konteks mobile
  const currentNavItem = navigationItems.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )
  const pageTitle = currentNavItem ? currentNavItem.title : "Dashboard"

  const roleLabel = {
    super_admin: "Super-Admin",
    admin: "Kokordinator",
    user: "Kepala Departemen",
  }[user.role]

  const roleIcon = {
    super_admin: (
      <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    ),
    admin: (
      <UserCheck className="size-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
    ),
    user: (
      <Award className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    ),
  }[user.role]

  const roleBadgeStyle = {
    super_admin:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300",
    admin:
      "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300",
    user:
      "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300",
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
    <header className="sticky top-0 z-30 w-full h-16 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs shrink-0">
      {/* Sisi Kiri Header: Navigasi, Toggle, Brand & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Tombol Hamburger Menu (Hanya Tampil di Mobile < md) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle || toggleMobile}
          className="md:hidden size-9 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Buka navigasi menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Tombol Toggle Sidebar Desktop (>= md) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex size-9 shrink-0 text-muted-foreground hover:text-foreground rounded-md"
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </Button>

        {/* Pemisah Vertikal Halus (Desktop >= md) */}
        <div className="hidden md:block h-4 w-px bg-border shrink-0" />

        {/* Brand Ringkas & Konteks Halaman (Mobile < md) */}
        <Link
          href="/dashboard"
          className="flex md:hidden items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
          title="Monitoring Departemen - Halaman Utama"
        >
          <div className="size-7 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs bg-muted/20 flex items-center justify-center">
            <Image
              src="/Logo.jpeg"
              alt="Logo Tazakka"
              width={28}
              height={28}
              className="size-full object-cover aspect-square"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-tight leading-tight truncate">
              Monitoring Dept
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight truncate sm:hidden">
              {pageTitle}
            </span>
          </div>
        </Link>

        {/* Judul Halaman & Info Konteks (Desktop >= md) */}
        <div className="hidden md:flex items-center gap-2.5 min-w-0 overflow-hidden">
          <h2 className="text-sm lg:text-base font-bold tracking-tight text-foreground truncate shrink-0">
            {pageTitle}
          </h2>
          {user.departmentName && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground border border-border min-w-0 max-w-[160px] md:max-w-[200px] lg:max-w-[280px] truncate"
              title={`Departemen: ${user.departmentName}`}
            >
              <Building2 className="size-3 text-primary shrink-0" />
              <span className="truncate">{user.departmentName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sisi Kanan Header: Mode Tampilan, Role Badge, Profile Avatar & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* 1. Mode Tampilan (Theme Toggle) */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>

        {/* 2. Role Badge (Tampil di Tablet/Desktop >= sm) */}
        <Badge
          variant="outline"
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium shrink-0",
            roleBadgeStyle
          )}
        >
          {roleIcon}
          <span className="truncate max-w-[110px] md:max-w-none">{roleLabel}</span>
        </Badge>

        {/* 3. Profil Pengguna & Dropdown Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group flex items-center gap-2 sm:gap-2.5 h-10 px-1.5 sm:px-2.5 rounded-full border border-border/50 hover:border-border/80 bg-background/50 hover:bg-muted/70 transition-all duration-150 cursor-pointer shrink-0 data-[state=open]:bg-muted data-[state=open]:border-border"
              aria-label="Menu akun pengguna"
            >
              <Avatar className="size-8 ring-1 ring-border/80 shrink-0">
                {user.fotoUrl && (
                  <AvatarImage
                    src={user.fotoUrl}
                    alt={user.nama}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Nama Pengguna & Email (Responsif: Nama di >= md, Email di >= lg) */}
              <div className="hidden md:flex flex-col text-left justify-center overflow-hidden min-w-0">
                <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[130px] lg:max-w-[170px] xl:max-w-[220px]">
                  {user.nama}
                </span>
                <span className="hidden lg:block text-[11px] text-muted-foreground leading-tight truncate max-w-[130px] lg:max-w-[170px] xl:max-w-[220px]">
                  {user.email}
                </span>
              </div>

              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 hidden sm:block shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72 p-1.5 shadow-lg border-border">
            {/* Header Ringkasan Akun dengan Avatar & Rincian Profil */}
            <DropdownMenuLabel className="p-2.5 font-normal">
              <div className="flex items-start gap-3">
                <Avatar className="size-10 ring-1 ring-border shrink-0 mt-0.5">
                  {user.fotoUrl && (
                    <AvatarImage
                      src={user.fotoUrl}
                      alt={user.nama}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {user.nama}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {user.email}
                  </p>

                  <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-medium ${roleBadgeStyle}`}
                    >
                      {roleIcon}
                      <span className="ml-1">{roleLabel}</span>
                    </Badge>
                  </div>

                  {user.departmentName && (
                    <p className="text-[11px] text-muted-foreground pt-0.5 flex items-center gap-1 truncate">
                      <Building2 className="size-3 text-primary shrink-0" />
                      <span className="truncate">{user.departmentName}</span>
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu Navigasi Profil */}
            <DropdownMenuItem asChild>
              <Link
                href="/profil"
                className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <UserIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">Profil Saya</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Tombol Logout */}
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="w-full text-left px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Keluar (Logout)</span>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
