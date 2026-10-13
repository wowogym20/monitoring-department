"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  PanelLeft,
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

  // Dapatkan judul halaman aktif untuk breadcrumb desktop
  const currentNavItem = navigationItems.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )
  const pageTitle = currentNavItem ? currentNavItem.title : "Dashboard"

  const roleLabel = {
    super_admin: "Super-Admin",
    admin: "Admin SDM",
    user: "Ketua Departemen",
  }[user.role]

  const roleIcon = {
    super_admin: (
      <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    ),
    admin: (
      <UserCheck className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
    ),
    user: (
      <Award className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    ),
  }[user.role]

  const roleBadgeStyle = {
    super_admin:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300",
    admin:
      "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300",
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
    <header className="sticky top-0 z-30 w-full h-16 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-2xs shrink-0">
      {/* Sisi Kiri Header: Mobile Hamburger & Brand atau Desktop Breadcrumb Title */}
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger Menu (Hanya Tampil di Mobile < md) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle || toggleMobile}
          className="md:hidden size-9"
          aria-label="Buka navigasi menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Tombol Toggle Sidebar Desktop (>= md) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex size-9 text-muted-foreground hover:text-foreground"
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          <PanelLeft className="size-5" />
        </Button>

        {/* Brand Ringkas (Mobile) */}
        <div className="flex md:hidden items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo Tazakka"
            width={28}
            height={28}
            className="size-7 object-contain shrink-0"
            priority
          />
          <span className="font-bold text-sm tracking-tight">
            Monitoring Dept
          </span>
        </div>

        {/* Judul Halaman & Info Konteks (Desktop >= md) */}
        <div className="hidden md:flex items-center gap-3">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {pageTitle}
          </h2>
          {user.departmentName && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
              <Building2 className="size-3 text-primary shrink-0" />
              <span className="truncate max-w-[240px]">{user.departmentName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sisi Kanan Header: Mode Tampilan, Role Badge, Profile Avatar & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Mode Tampilan (Theme Toggle) */}
        <ThemeToggle />

        {/* 2. Role Badge (Tampil di Tablet/Desktop) */}
        <Badge
          variant="outline"
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${roleBadgeStyle}`}
        >
          {roleIcon}
          <span>{roleLabel}</span>
        </Badge>

        {/* 3. Profil Pengguna & Dropdown Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-1.5 sm:px-2 rounded-full sm:rounded-md hover:bg-muted/80"
              aria-label="Menu akun pengguna"
            >
              <Avatar className="size-8 ring-1 ring-border">
                {user.fotoUrl && (
                  <AvatarImage src={user.fotoUrl} alt={user.nama} />
                )}
                <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Nama Pengguna & Email (Desktop Lebar) */}
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[140px]">
                  {user.nama}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>

              <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 p-1.5">
            {/* Header Ringkasan Akun */}
            <DropdownMenuLabel className="p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.nama}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <div className="pt-1.5 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 font-normal ${roleBadgeStyle}`}
                  >
                    {roleIcon}
                    <span className="ml-1">{roleLabel}</span>
                  </Badge>
                </div>
                {user.departmentName && (
                  <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Building2 className="size-3 shrink-0" />
                    <span className="truncate">{user.departmentName}</span>
                  </p>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu Navigasi Profil */}
            <DropdownMenuItem asChild>
              <Link
                href="/profil"
                className="cursor-pointer flex items-center gap-2 px-2.5 py-2 text-sm text-foreground hover:bg-muted rounded-sm"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                <span>Profil Saya</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Tombol Logout */}
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="w-full text-left px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-sm flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
