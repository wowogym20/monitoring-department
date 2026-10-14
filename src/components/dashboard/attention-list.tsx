import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AttentionDepartmentItem,
  AttentionSubmissionItem,
  KetuaAttentionItem,
} from "@/lib/dashboard/types"
import { formatDateJakarta } from "@/lib/date"
import {
  AlertTriangle,
  Building2,
  FileCheck2,
  ArrowRight,
  RotateCcw,
  CheckCircle,
} from "lucide-react"

export interface AttentionListProps {
  role: "user" | "admin" | "super_admin"
  // Data untuk Ketua
  ketuaItems?: KetuaAttentionItem[]
  // Data untuk Admin / Super-Admin
  incompleteDepartments?: AttentionDepartmentItem[]
  pendingSubmissions?: AttentionSubmissionItem[]
}

/**
 * Komponen AttentionList Reusable
 * Menampilkan daftar "Perlu Tindak Lanjut" dengan aksen oren hangat:
 * - Role User (Ketua): Anggota belum dinilai / berstatus Revision Requested + tombol aksi cepat ke /penilaian/[anggotaId]
 * - Role Admin/Super-Admin: Departemen belum selesai menilai & penilaian status Submitted menunggu review + tautan ke /rekap terfilter
 */
export function AttentionList({
  role,
  ketuaItems = [],
  incompleteDepartments = [],
  pendingSubmissions = [],
}: AttentionListProps) {
  // ---------------------------------------------------------------------------
  // 1. TAMPILAN KETUA DEPARTEMEN
  // ---------------------------------------------------------------------------
  if (role === "user") {
    const hasItems = ketuaItems.length > 0

    return (
      <Card className="border-border shadow-xs border-l-4 border-l-orange-500">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              <CardTitle className="text-base font-bold">
                Daftar Perlu Tindak Lanjut Penilaian
              </CardTitle>
            </div>
            {hasItems && (
              <Badge className="bg-orange-700 text-white dark:bg-orange-800 text-xs font-bold">
                {ketuaItems.length} Anggota
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Anggota yang belum memiliki nilai final atau membutuhkan revisi sesuai catatan SDM
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed border-border p-4">
              <CheckCircle className="size-8 text-emerald-600 dark:text-emerald-400 mb-2" aria-hidden="true" />
              <p className="font-semibold text-sm text-foreground">
                Semua Anggota Sudah Dinilai
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tidak ada anggota yang tertunda atau memerlukan revisi pada periode ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ketuaItems.map((item) => {
                const isRevision = item.status === "revision_requested"

                return (
                  <div
                    key={item.member_id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {item.nama}
                        </span>
                        {isRevision ? (
                          <Badge className="bg-orange-700 text-white dark:bg-orange-800 text-[10px] font-bold px-2 py-0.5 gap-1">
                            <RotateCcw className="size-3" aria-hidden="true" />
                            <span>Perlu Revisi</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Belum Dinilai
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.jabatan} {item.nip ? `• NIG: ${item.nip}` : ""}
                      </p>
                    </div>

                    <div className="self-end sm:self-auto shrink-0">
                      <Link href={item.href}>
                        <Button
                          size="sm"
                          variant={isRevision ? "secondary" : "default"}
                          className="h-8 text-xs gap-1.5 px-3 font-semibold"
                        >
                          <span>{isRevision ? "Perbaiki Penilaian" : "Isi Nilai"}</span>
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // 2. TAMPILAN ADMIN & SUPER_ADMIN
  // ---------------------------------------------------------------------------
  const totalIncomplete = incompleteDepartments.length
  const totalPending = pendingSubmissions.length

  return (
    <Card className="border-border shadow-xs border-l-4 border-l-orange-500">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <CardTitle className="text-base font-bold">
              Perlu Tindak Lanjut SDM
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {totalPending > 0 && (
              <Badge className="bg-orange-700 text-white dark:bg-orange-800 text-xs font-bold">
                {totalPending} Menunggu Review
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          Pantau departemen yang belum tuntas menilai dan tinjau penilaian yang telah diserahkan
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6 pt-2">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/80">
            <TabsTrigger
              value="pending"
              className="text-xs gap-1.5 font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:text-foreground data-[state=active]:font-bold"
            >
              <FileCheck2 className="size-3.5" aria-hidden="true" />
              <span>Menunggu Review ({totalPending})</span>
            </TabsTrigger>
            <TabsTrigger
              value="incomplete"
              className="text-xs gap-1.5 font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:text-foreground data-[state=active]:font-bold"
            >
              <Building2 className="size-3.5" aria-hidden="true" />
              <span>Belum Selesai ({totalIncomplete})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Penilaian Status Submitted Menunggu Review */}
          <TabsContent value="pending" className="mt-0 space-y-3">
            {totalPending === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-4">
                <CheckCircle className="size-6 text-emerald-600 mx-auto mb-1.5" aria-hidden="true" />
                Tidak ada penilaian berstatus Submitted yang menunggu review.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingSubmissions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.assessment_id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {sub.member_nama}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-semibold"
                        >
                          Submitted
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sub.department_nama} • {sub.member_jabatan}
                        {sub.submitted_at && (
                          <span> • Dikirim: {formatDateJakarta(sub.submitted_at)}</span>
                        )}
                      </p>
                    </div>

                    <div className="self-end sm:self-auto shrink-0">
                      <Link href={sub.href}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 dark:hover:bg-orange-950/50"
                        >
                          <span>Review Penilaian</span>
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPending > 5 && (
              <div className="pt-2 text-center">
                <Link href="/rekap?status=submitted">
                  <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-400 font-semibold gap-1">
                    <span>Lihat {totalPending - 5} penilaian menunggu review lainnya</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Departemen Belum Selesai Menilai */}
          <TabsContent value="incomplete" className="mt-0 space-y-3">
            {totalIncomplete === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-4">
                <CheckCircle className="size-6 text-emerald-600 mx-auto mb-1.5" aria-hidden="true" />
                Seluruh departemen telah menyelesaikan pengisian penilaian anggota.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {incompleteDepartments.slice(0, 6).map((dept) => (
                  <div
                    key={dept.department_id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {dept.nama} ({dept.kode})
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-medium mt-0.5">
                        Tersisa {dept.remainingCount} anggota belum dinilai ({dept.assessedCount} dari {dept.totalMembers} selesai)
                      </p>
                    </div>

                    <div className="self-end sm:self-auto shrink-0">
                      <Link href={dept.href}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 dark:hover:bg-orange-950/50"
                        >
                          <span>Pantau Rekap</span>
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalIncomplete > 6 && (
              <div className="pt-2 text-center">
                <Link href="/rekap">
                  <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-400 font-semibold gap-1">
                    <span>Buka halaman rekap lengkap</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
