"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { DepartmentRekapSummary } from "@/lib/actions/rekap"
import {
  AlertCircle,
  CheckCircle2,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RekapSummaryCardsProps {
  summaries: DepartmentRekapSummary[]
}

/**
 * Ringkasan capaian per departemen di atas tabel rekap:
 * - Metrik KPI Agregat (Total Departemen, Selesai, Belum Selesai, Rata-rata Skor Global)
 * - Kartu Departemen dengan penanda oren jika belum selesai menilai (US-10)
 * - Tampilan rapi, mobile-friendly (360px), dan collapsible
 */
export function RekapSummaryCards({ summaries }: RekapSummaryCardsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!summaries || summaries.length === 0) {
    return null
  }

  // Hitung metrik agregat global
  const totalDepts = summaries.length
  const completedDepts = summaries.filter((d) => !d.is_incomplete).length
  const incompleteDepts = summaries.filter((d) => d.is_incomplete).length

  let totalMembersAll = 0
  let assessedMembersAll = 0
  let totalScoreSum = 0
  let scoreCount = 0

  for (const d of summaries) {
    totalMembersAll += d.total_members
    assessedMembersAll += d.assessed_count
    if (d.average_score !== null) {
      totalScoreSum += d.average_score * d.assessed_count
      scoreCount += d.assessed_count
    }
  }

  const overallPercentage =
    totalMembersAll > 0
      ? Math.round((assessedMembersAll / totalMembersAll) * 100)
      : 0

  const globalAvgScore =
    scoreCount > 0 ? Number((totalScoreSum / scoreCount).toFixed(2)) : null

  return (
    <div className="space-y-4">
      {/* 1. Baris Kartu KPI Global Agregat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Anggota & Progres */}
        <Card className="border border-border/80 shadow-2xs bg-card/60 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Anggota</span>
              <Users className="size-4 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {assessedMembersAll} <span className="text-xs sm:text-sm font-normal text-muted-foreground">/ {totalMembersAll}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progres Evaluasi</span>
              <span className="font-semibold text-foreground">{overallPercentage}%</span>
            </div>
            <Progress value={overallPercentage} className="h-1.5 [&>div]:bg-primary" />
          </CardContent>
        </Card>

        {/* KPI 2: Departemen Selesai */}
        <Card className="border border-border/80 shadow-2xs bg-card/60 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Dept. Selesai</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {completedDepts} <span className="text-xs sm:text-sm font-normal text-muted-foreground">/ {totalDepts}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <p className="text-[11px] text-muted-foreground truncate">
              {completedDepts === totalDepts
                ? "Seluruh departemen tuntas"
                : `${totalDepts - completedDepts} departemen berprogres`}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Penanda Belum Selesai (US-10) */}
        <Card
          className={cn(
            "border shadow-2xs bg-card/60 relative overflow-hidden",
            incompleteDepts > 0
              ? "border-orange-300 dark:border-orange-800 bg-orange-50/20 dark:bg-orange-950/20"
              : "border-border/80"
          )}
        >
          <div
            className={cn(
              "absolute top-0 inset-x-0 h-1",
              incompleteDepts > 0 ? "bg-orange-500" : "bg-emerald-500"
            )}
          />
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Perlu Perhatian</span>
              <AlertCircle
                className={cn(
                  "size-4",
                  incompleteDepts > 0 ? "text-orange-500" : "text-emerald-500"
                )}
              />
            </div>
            <CardTitle
              className={cn(
                "text-xl sm:text-2xl font-bold tracking-tight",
                incompleteDepts > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-foreground"
              )}
            >
              {incompleteDepts}{" "}
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                Departemen
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <p className="text-[11px] text-muted-foreground truncate">
              {incompleteDepts > 0
                ? "Menilai belum rampung (US-10)"
                : "Semua departemen lengkap"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Rata-rata Skor Global */}
        <Card className="border border-border/80 shadow-2xs bg-card/60 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-orange-500" />
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Rata-rata Skor</span>
              <BarChart2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {globalAvgScore !== null ? globalAvgScore.toFixed(2) : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            {globalAvgScore !== null ? (
              <SkorBadge skor={globalAvgScore} showScore={false} />
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Belum ada skor masuk
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Header Kontrol Rincian Departemen (Bisa di-toggle agar tidak memenuhi layar) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Ringkasan Progres per Departemen
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {summaries.length}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <span>{isExpanded ? "Sembunyikan Rincian" : "Lihat Semua Departemen"}</span>
          {isExpanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
      </div>

      {/* 3. Grid Rincian Tiap Departemen (Tampil saat expanded atau jika departemen <= 3) */}
      {(isExpanded || summaries.length <= 3) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in-50 duration-200">
          {summaries.map((dept) => {
            const percentage =
              dept.total_members > 0
                ? Math.round((dept.assessed_count / dept.total_members) * 100)
                : 0

            return (
              <Card
                key={dept.id}
                className={cn(
                  "transition-all duration-200 shadow-2xs border bg-card/90 relative overflow-hidden",
                  dept.is_incomplete
                    ? "border-orange-300 dark:border-orange-800/80 bg-orange-50/20 dark:bg-orange-950/20"
                    : "border-border hover:border-emerald-500/50"
                )}
              >
                {/* Aksen garis atas subtle sesuai PRD 10.1.D */}
                <div
                  className={cn(
                    "absolute top-0 inset-x-0 h-0.5",
                    dept.is_incomplete
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  )}
                />

                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-bold truncate leading-tight text-foreground">
                        {dept.nama}
                      </CardTitle>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Kode: {dept.kode}
                      </span>
                    </div>

                    {dept.is_incomplete ? (
                      <Badge
                        className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold gap-1 shrink-0 shadow-2xs px-2 py-0.5"
                        title="Departemen ini belum selesai menilai seluruh anggotanya (US-10)"
                      >
                        <AlertCircle className="size-3" />
                        Belum Selesai
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold gap-1 shrink-0 shadow-2xs px-2 py-0.5"
                      >
                        <CheckCircle2 className="size-3" />
                        Selesai
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 space-y-2.5">
                  {/* Progres Anggota */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <Users className="size-3 text-muted-foreground" />
                        Dinilai:
                      </span>
                      <span className="font-semibold text-foreground text-[11px]">
                        {dept.assessed_count} / {dept.total_members} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn(
                        "h-1.5",
                        dept.is_incomplete
                          ? "[&>div]:bg-orange-500"
                          : "[&>div]:bg-emerald-600"
                      )}
                    />
                  </div>

                  {/* Skor Rata-rata */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Rata-rata Skor:</span>
                    {dept.average_score !== null ? (
                      <SkorBadge skor={dept.average_score} showScore={true} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Belum ada nilai
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
