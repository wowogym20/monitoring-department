"use client"

import React from "react"
import {
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownZA,
  ArrowUp10,
  ArrowDown01,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | "none" | false
export type SortType = "alpha" | "numeric" | "date" | "general"

export interface SortableHeaderProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  label: string
  direction: SortDirection
  onToggle: () => void
  type?: SortType
  className?: string
  iconClassName?: string
}

function getSortTooltip(label: string, direction: SortDirection, type: SortType = "alpha"): string {
  if (type === "numeric") {
    if (direction === "asc") return `Urutkan ${label}: Terkecil ke terbesar (klik untuk membalik)`
    if (direction === "desc") return `Urutkan ${label}: Terbesar ke terkecil (klik untuk ubah)`
    return `Klik untuk mengurutkan ${label} dari terkecil`
  }
  if (type === "date") {
    if (direction === "asc") return `Urutkan ${label}: Terlama ke terbaru (klik untuk membalik)`
    if (direction === "desc") return `Urutkan ${label}: Terbaru ke terlama (klik untuk ubah)`
    return `Klik untuk mengurutkan ${label} dari terbaru`
  }
  if (type === "general") {
    if (direction === "asc") return `Urutkan ${label}: Urutan naik (klik untuk membalik)`
    if (direction === "desc") return `Urutkan ${label}: Urutan turun (klik untuk ubah)`
    return `Klik untuk mengurutkan ${label}`
  }
  // Default: alpha
  if (direction === "asc") return `Urutkan abjad: A ke Z (klik untuk Z ke A)`
  if (direction === "desc") return `Urutkan abjad: Z ke A (klik untuk ubah pengurutan)`
  return `Klik untuk mengurutkan ${label} A ke Z`
}

export function SortableHeader({
  label,
  direction,
  onToggle,
  type = "alpha",
  className,
  iconClassName,
  children,
  ...props
}: SortableHeaderProps) {
  const isSorted = direction === "asc" || direction === "desc"

  const renderIcon = () => {
    if (direction === "asc") {
      if (type === "numeric") {
        return (
          <ArrowUp10
            className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
            aria-hidden="true"
          />
        )
      }
      if (type === "date" || type === "general") {
        return (
          <ArrowUp
            className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
            aria-hidden="true"
          />
        )
      }
      return (
        <ArrowUpAZ
          className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
          aria-hidden="true"
        />
      )
    }

    if (direction === "desc") {
      if (type === "numeric") {
        return (
          <ArrowDown01
            className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
            aria-hidden="true"
          />
        )
      }
      if (type === "date" || type === "general") {
        return (
          <ArrowDown
            className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
            aria-hidden="true"
          />
        )
      }
      return (
        <ArrowDownZA
          className={cn("size-3.5 text-primary shrink-0 transition-transform", iconClassName)}
          aria-hidden="true"
        />
      )
    }

    return (
      <ArrowUpDown
        className={cn(
          "size-3 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-colors",
          iconClassName
        )}
        aria-hidden="true"
      />
    )
  }

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
      title={getSortTooltip(label, direction, type)}
      aria-label={`Urutkan berdasarkan ${label}`}
      {...props}
    >
      <span>{children || label}</span>
      {renderIcon()}
    </button>
  )
}
