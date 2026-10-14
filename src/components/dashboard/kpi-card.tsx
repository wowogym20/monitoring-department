import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    variant?: "default" | "secondary" | "outline" | "destructive"
    className?: string
  }
  className?: string
  ariaLabel?: string
}

/**
 * Komponen KpiCard Reusable
 * Sesuai PRD 10.1.D: Memiliki aksen garis atas tipis gradien emerald -> oren (from-emerald-500 to-orange-500).
 * Menggunakan shadcn Card, mendukung Dark Mode, dan memenuhi kontras WCAG AA.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  className,
  ariaLabel,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border bg-card shadow-xs pt-1 transition-all",
        className
      )}
      aria-label={ariaLabel || `${title}: ${value}`}
    >
      {/* Garis atas gradien tipis emerald -> oren (PRD 10.1.D) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-orange-500"
        aria-hidden="true"
      />

      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-muted/60 text-foreground shrink-0">
          <Icon className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </div>
          {badge && (
            <Badge
              variant={badge.variant || "outline"}
              className={cn("text-xs font-semibold shrink-0", badge.className)}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
