import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreDistributionCategory } from "@/lib/dashboard/types"
import { Award } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ScoreDistributionProps {
  distribution: ScoreDistributionCategory[]
  title?: string
  description?: string
}

/**
 * Komponen Distribusi Kategori Skor
 * Sesuai PRD Bagian 8 & Dashboard ADMIN:
 * Menampilkan sebaran kategori skor (Sangat Baik s.d. Sangat Kurang)
 * memakai warna badge dan palet visual resmi PRD Bagian 8.
 */
export function ScoreDistribution({
  distribution,
  title = "Distribusi Kategori Skor Kinerja",
  description = "Sebaran capaian penilaian seluruh anggota pada periode berjalan (PRD Bagian 8)",
}: ScoreDistributionProps) {
  const totalAssessed = distribution.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <CardTitle className="text-base font-bold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalAssessed} Total Dinilai
          </Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6 pt-1">
        {totalAssessed === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-4">
            Belum ada nilai yang di-submit pada periode ini.
          </div>
        ) : (
          <div className="space-y-3">
            {distribution.map((cat) => (
              <div
                key={cat.key}
                className="p-3 rounded-lg border border-border bg-card/60 space-y-1.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold px-2.5 py-0.5", cat.badgeClass)}
                    >
                      {cat.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      Rentang: {cat.range}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {cat.count} orang
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Bar Mini Visualisasi Rasio */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      cat.key === "sangat_baik" && "bg-emerald-600",
                      cat.key === "baik" && "bg-emerald-500",
                      cat.key === "cukup" && "bg-slate-500",
                      cat.key === "kurang" && "bg-orange-500",
                      cat.key === "sangat_kurang" && "bg-orange-700"
                    )}
                    style={{ width: `${cat.percentage}%` }}
                    aria-hidden="true"
                  />
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  {cat.meaning}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
