"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getAppVersion } from "@/lib/version"

interface AppFooterProps {
  className?: string
}

export function AppFooter({ className }: AppFooterProps) {
  const version = getAppVersion()

  return (
    <footer
      className={cn(
        "w-full border-t border-border/40 py-3 px-4 sm:px-6 text-xs text-muted-foreground flex items-center justify-between gap-2 shrink-0 select-none",
        className
      )}
    >
      <span className="truncate">Copyright © 2026</span>
      <span className="font-medium shrink-0">Version {version}</span>
    </footer>
  )
}
