import React from "react"
import { Badge } from "@/components/ui/badge"
import { kategoriSkor } from "@/lib/scoring"
import { cn } from "@/lib/utils"

interface SkorBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  skor: number | null | undefined
  showScore?: boolean
  showMeaning?: boolean
}

/**
 * Komponen SkorBadge berbasis shadcn Badge
 * Menampilkan kategori skor dengan styling sesuai PRD Bagian 8.
 */
export function SkorBadge({
  skor,
  showScore = true,
  showMeaning = false,
  className,
  ...props
}: SkorBadgeProps) {
  const result = kategoriSkor(skor)

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)} {...props}>
      <Badge
        variant="outline"
        className={cn(
          "font-semibold text-xs px-2.5 py-0.5 rounded-full border transition-colors shadow-2xs",
          result.badgeClass
        )}
        title={result.meaning}
      >
        {showScore && result.skorFormatted !== "-" ? (
          <span>
            {result.skorFormatted} • {result.kategori}
          </span>
        ) : (
          <span>{result.kategori}</span>
        )}
      </Badge>
      {showMeaning && (
        <span className="text-[11px] text-muted-foreground">{result.meaning}</span>
      )}
    </div>
  )
}
