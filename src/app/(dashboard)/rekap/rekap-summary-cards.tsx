"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { DepartmentRekapSummary } from "@/lib/actions/rekap"
import { AlertCircle, CheckCircle2, Users, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RekapSummaryCardsProps {
  summaries: DepartmentRekapSummary[]
}

/**
 * Ringkasan capaian per departemen di atas tabel rekap:
 * - Jumlah anggota
 * - Sudah dinilai (submitted/approved/revision_requested)
 * - Rata-rata skor
 * - Penanda oren jika departemen belum selesai menilai (US-10)
 */
export function RekapSummaryCards({ summaries }: RekapSummaryCardsProps) {
  if (!summaries || summaries.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Ringkasan Progres per Departemen
        </h2>
        <span className="text-xs text-muted-foreground">
          {summaries.length} Departemen
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((dept) => {
          const percentage =
            dept.total_members > 0
              ? Math.round((dept.assessed_count / dept.total_members) * 100)
              : 0

          return (
            <Card
              key={dept.id}
              className={cn(
                "transition-all duration-200 shadow-2xs border",
                dept.is_incomplete
                  ? "border-orange-300 dark:border-orange-800/80 bg-orange-50/40 dark:bg-orange-950/20"
                  : "border-border hover:border-emerald-500/50"
              )}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold truncate leading-snug">
                      {dept.nama}
                    </CardTitle>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Kode: {dept.kode}
                    </span>
                  </div>

                  {dept.is_incomplete ? (
                    <Badge
                      className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold gap-1 shrink-0 shadow-2xs"
                      title="Departemen ini belum selesai menilai seluruh anggotanya (US-10)"
                    >
                      <AlertCircle className="size-3" />
                      Belum Selesai
                    </Badge>
                  ) : (
                    <Badge
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold gap-1 shrink-0 shadow-2xs"
                    >
                      <CheckCircle2 className="size-3" />
                      Selesai
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                {/* Progres Anggota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      Dinilai:
                    </span>
                    <span className="font-semibold text-foreground">
                      {dept.assessed_count} / {dept.total_members} Anggota ({percentage}%)
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className={cn(
                      "h-2",
                      dept.is_incomplete
                        ? "[&>div]:bg-orange-500"
                        : "[&>div]:bg-emerald-600"
                    )}
                  />
                </div>

                {/* Skor Rata-rata */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rata-rata Skor:</span>
                  {dept.average_score !== null ? (
                    <SkorBadge skor={dept.average_score} showScore={true} />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Belum ada nilai
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
