import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProgressCardProps {
  totalMembers: number
  assessedCount: number
  draftCount?: number
  completionPercent: number
  periodName?: string
  periodEndDateFormatted: string
  daysRemaining: number
  isNearDeadline: boolean
  isPastDeadline: boolean
  unreadCommentsCount: number
  unreadComments?: Array<{
    assessmentId: string
    memberNama: string
    authorNama: string
    isi: string
    createdAt: string
  }>
  departmentName?: string
}

/**
 * Komponen ProgressCard untuk Dashboard Ketua Departemen (Role User)
 * Sesuai PRD FR-10:
 * - Menampilkan "X dari Y anggota sudah dinilai" dengan progress bar emerald.
 * - Indikator oren bila tenggat mendekat (≤ 3 hari).
 * - Badge oren jumlah komentar SDM yang belum dibaca + tautan langsung.
 */
export function ProgressCard({
  totalMembers,
  assessedCount,
  draftCount = 0,
  completionPercent,
  periodName,
  periodEndDateFormatted,
  daysRemaining,
  isNearDeadline,
  isPastDeadline,
  unreadCommentsCount,
  unreadComments = [],
  departmentName,
}: ProgressCardProps) {
  const isComplete = totalMembers > 0 && assessedCount >= totalMembers

  return (
    <Card className="relative overflow-hidden border-border bg-card shadow-xs pt-1">
      {/* Garis atas gradien tipis emerald -> oren (PRD 10.1.D) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-orange-500"
        aria-hidden="true"
      />

      <CardHeader className="pb-3 pt-5 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <CardTitle className="text-base sm:text-lg font-bold">
                Progres Penilaian Anggota
              </CardTitle>
            </div>
            {departmentName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Departemen: <span className="font-medium text-foreground">{departmentName}</span>
              </p>
            )}
          </div>

          {/* Badge Status Kelengkapan */}
          {isComplete ? (
            <Badge className="bg-emerald-700 text-white dark:bg-emerald-800 hover:bg-emerald-700 font-medium text-xs px-2.5 py-1 gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              <span>100% Selesai Dinilai</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground font-medium text-xs px-2.5 py-1 gap-1 self-start sm:self-auto">
              <Clock className="size-3.5" aria-hidden="true" />
              <span>{completionPercent}% Terpenuhi</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
        {/* Info Progres: X dari Y anggota */}
        <div>
          <div className="flex items-baseline justify-between text-sm mb-2">
            <span className="font-semibold text-foreground text-base sm:text-lg">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {assessedCount}
              </span>{" "}
              dari{" "}
              <span className="font-extrabold">{totalMembers}</span> anggota sudah dinilai
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {completionPercent}%
            </span>
          </div>

          {/* Progress Bar Emerald */}
          <div className="space-y-1">
            <Progress
              value={completionPercent}
              className={cn(
                "h-3 w-full bg-muted/80 rounded-full",
                // Styling visual emerald penuh
                "[&>div]:bg-emerald-600 dark:[&>div]:bg-emerald-500 [&>div]:transition-all"
              )}
              aria-label={`Progres penilaian: ${assessedCount} dari ${totalMembers} anggota (${completionPercent}%)`}
            />
            {draftCount > 0 && (
              <p className="text-[11px] text-muted-foreground italic">
                * Terdapat {draftCount} penilaian yang masih tersimpan sebagai draf.
              </p>
            )}
          </div>
        </div>

        {/* Baris Informasi Periode & Tenggat Waktu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Tanggal Akhir Periode & Alert Tenggat */}
          <div
            className={cn(
              "p-3 rounded-lg border text-xs space-y-1 transition-colors",
              isNearDeadline
                ? "border-orange-300 bg-orange-50/80 text-orange-950 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200"
                : isPastDeadline
                ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20"
                : "border-border bg-muted/40 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="size-4 shrink-0 text-foreground" aria-hidden="true" />
              <span className="text-foreground font-semibold">Tenggat Waktu Periode</span>
            </div>
            <p className="text-xs font-medium">
              Berakhir pada: <span className="font-bold text-foreground">{periodEndDateFormatted}</span>
            </p>

            {isNearDeadline && (
              <div className="flex items-center gap-1.5 text-orange-800 dark:text-orange-300 font-bold mt-1">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Tenggat mendekat: Sisa {daysRemaining} hari lagi ({periodName || "Periode Aktif"})!
                </span>
              </div>
            )}

            {isPastDeadline && (
              <p className="text-destructive font-bold mt-1">
                Periode penilaian telah berakhir.
              </p>
            )}
          </div>

          {/* Badge Komentar SDM yang Belum Dibaca */}
          <div
            className={cn(
              "p-3 rounded-lg border text-xs space-y-1.5 transition-colors flex flex-col justify-between",
              unreadCommentsCount > 0
                ? "border-orange-300 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/40"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare
                  className={cn(
                    "size-4 shrink-0",
                    unreadCommentsCount > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span className="font-semibold text-foreground">Umpan Balik SDM</span>
              </div>

              {unreadCommentsCount > 0 ? (
                <Badge className="bg-orange-700 text-white dark:bg-orange-800 hover:bg-orange-700 font-bold text-xs px-2 py-0.5">
                  {unreadCommentsCount} Belum Dibaca
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Semua Terbaca
                </Badge>
              )}
            </div>

            {unreadCommentsCount > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-orange-900 dark:text-orange-200">
                  Ada {unreadCommentsCount} komentar dari tim SDM yang perlu Anda tinjau.
                </p>
                {unreadComments[0] && (
                  <Link
                    href={`/rekap/${unreadComments[0].assessmentId}`}
                    className="inline-flex items-center gap-1 font-bold text-orange-700 dark:text-orange-300 hover:underline pt-0.5"
                  >
                    <span>Buka Penilaian {unreadComments[0].memberNama}</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Belum ada komentar tertunda dari tim SDM untuk departemen Anda.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
