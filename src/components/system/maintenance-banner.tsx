"use client"

import React from "react"
import Link from "next/link"
import { Wrench, ShieldAlert, ArrowRight } from "lucide-react"
import { UserRole } from "@/types/database"

interface MaintenanceBannerProps {
  isActive: boolean
  message: string
  userRole: UserRole
}

export function MaintenanceBanner({
  isActive,
  message,
  userRole,
}: MaintenanceBannerProps) {
  if (!isActive) return null

  const isSuperAdmin = userRole === "super_admin"

  if (isSuperAdmin) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-2xs mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">
            <strong>Mode Pemeliharaan Aktif:</strong> Pengguna umum dibatasi ke mode baca-saja (*read-only*). Anda login sebagai Super-Admin dengan akses penuh.
          </span>
        </div>
        <Link
          href="/pengaturan"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold underline hover:text-amber-700 dark:hover:text-amber-100 transition-colors"
        >
          Kelola Pengaturan
          <ArrowRight className="size-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-orange-500/15 border-b border-orange-500/30 text-orange-950 dark:text-orange-200 px-4 py-3 text-xs sm:text-sm font-medium flex items-start sm:items-center gap-3 shadow-2xs">
      <ShieldAlert className="size-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1">
        <p className="font-bold tracking-tight">
          Mode Pemeliharaan Aktif (Baca-Saja)
        </p>
        <p className="text-xs text-orange-900/90 dark:text-orange-300 mt-0.5 leading-relaxed">
          {message || "Sistem saat ini sedang dalam pemeliharaan berkala. Seluruh formulir berada dalam mode baca-saja (*read-only*). Pengisian atau perubahan data dinonaktifkan sementara."}
        </p>
      </div>
    </div>
  )
}
