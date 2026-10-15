"use client"

import React, { useState } from "react"
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react"
import { ContentSettings } from "@/lib/settings/default-settings"
import { UserRole } from "@/types/database"
import { cn } from "@/lib/utils"

interface AnnouncementBannerProps {
  announcement: ContentSettings["announcement"]
  userRole: UserRole
}

export function AnnouncementBanner({
  announcement,
  userRole,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!announcement?.isActive || dismissed) {
    return null
  }

  // Cek apakah user role sesuai target audiens
  const isTargeted =
    announcement.targetRoles.includes("all") ||
    announcement.targetRoles.includes(userRole)

  if (!isTargeted) {
    return null
  }

  const typeConfig = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
      text: "text-blue-950 dark:text-blue-100",
      icon: Info,
      iconColor: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
      text: "text-amber-950 dark:text-amber-100",
      icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
      text: "text-emerald-950 dark:text-emerald-100",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
    },
    destructive: {
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900",
      text: "text-rose-950 dark:text-rose-100",
      icon: AlertCircle,
      iconColor: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300",
    },
  }[announcement.type || "info"]

  const Icon = typeConfig.icon

  return (
    <div
      role="region"
      aria-label="Pengumuman Sistem"
      className={cn(
        "rounded-xl border p-4 sm:p-5 shadow-xs transition-all relative",
        typeConfig.bg,
        typeConfig.text
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="size-9 rounded-lg bg-background/80 flex items-center justify-center shrink-0 border border-current/10 shadow-2xs">
          <Icon className={cn("size-5", typeConfig.iconColor)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                typeConfig.badge
              )}
            >
              Pengumuman
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              {announcement.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed opacity-90 whitespace-pre-line">
            {announcement.message}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity"
          aria-label="Tutup pengumuman"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
