"use client"

import React from "react"
import { ArrowUpDown, ArrowUpAZ, ArrowDownZA } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | "none" | false

export interface SortableHeaderProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  direction: SortDirection
  onToggle: () => void
  className?: string
  iconClassName?: string
}

export function SortableHeader({
  label,
  direction,
  onToggle,
  className,
  iconClassName,
  children,
  ...props
}: SortableHeaderProps) {
  const isSorted = direction === "asc" || direction === "desc"

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group inline-flex items-center gap-1.5 font-semibold text-xs tracking-tight transition-colors cursor-pointer select-none -ml-1.5 px-1.5 py-1 rounded-md hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-left",
        isSorted
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      title={`Urutkan abjad: ${
        direction === "asc"
          ? "A ke Z (klik untuk Z ke A)"
          : direction === "desc"
          ? "Z ke A (klik untuk ubah pengurutan)"
          : "Klik untuk mengurutkan A ke Z"
      }`}
      aria-label={`Urutkan abjad berdasarkan ${label}`}
      {...props}
    >
      <span>{children || label}</span>
      {direction === "asc" ? (
        <ArrowUpAZ
          className={cn(
            "size-3.5 text-primary shrink-0 transition-transform",
            iconClassName
          )}
          aria-hidden="true"
        />
      ) : direction === "desc" ? (
        <ArrowDownZA
          className={cn(
            "size-3.5 text-primary shrink-0 transition-transform",
            iconClassName
          )}
          aria-hidden="true"
        />
      ) : (
        <ArrowUpDown
          className={cn(
            "size-3 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-colors",
            iconClassName
          )}
          aria-hidden="true"
        />
      )}
    </button>
  )
}
