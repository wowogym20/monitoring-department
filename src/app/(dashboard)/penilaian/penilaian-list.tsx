"use client"

import React, { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PenilaianDashboardData } from "@/lib/actions/penilaian"
import { StatusBadge } from "@/components/penilaian/status-badge"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ArrowRight,
  ClipboardList,
} from "lucide-react"

interface PenilaianListProps {
  initialData: PenilaianDashboardData
}

export function PenilaianList({ initialData }: PenilaianListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const {
    periodeList,
    selectedPeriode,
    departments,
    selectedDepartmentId,
    members,
    summary,
    userRole,
  } = initialData

  const handlePeriodChange = (periodeId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("periodeId", periodeId)
      router.push(`/penilaian?${params.toString()}`)
    })
  }

  const handleDepartmentChange = (deptId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (deptId === "all") {
        params.delete("departmentId")
      } else {
        params.set("departmentId", deptId)
      }
      router.push(`/penilaian?${params.toString()}`)
    })
  }

  // Filter anggota berdasarkan pencarian dan status
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.nip && member.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      member.jabatan.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (statusFilter === "all") return true
    if (statusFilter === "unassessed") return member.status === "unassessed"
    if (statusFilter === "draft") return member.status === "draft"
    if (statusFilter === "submitted") return member.status === "submitted"
    if (statusFilter === "approved") return member.status === "approved"
    if (statusFilter === "revision_requested") return member.status === "revision_requested"

    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Penilaian Anggota
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "user"
              ? "Evaluasi kinerja berkala untuk seluruh anggota di departemen Anda."
              : "Monitoring dan evaluasi lembar penilaian kinerja anggota seluruh departemen."}
          </p>
        </div>

        {/* Selector Periode & Selector Departemen */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector Periode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline flex items-center gap-1">
              <Calendar className="size-3.5 text-primary" /> Periode:
            </span>
            <Select
              value={selectedPeriode?.id || ""}
              onValueChange={handlePeriodChange}
              disabled={isPending || periodeList.length === 0}
            >
              <SelectTrigger className="w-[200px] sm:w-[240px] text-xs h-9 font-medium" id="select-periode">
                <SelectValue placeholder="Pilih Periode..." />
              </SelectTrigger>
              <SelectContent>
                {periodeList.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    <span className="font-medium">{p.nama}</span>{" "}
                    <span className="text-muted-foreground text-[10px]">
                      ({p.status === "open" ? "Buka" : "Tutup"})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Departemen (Khusus Admin & Super Admin) */}
          {(userRole === "super_admin" || userRole === "admin") && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline flex items-center gap-1">
                <Building2 className="size-3.5 text-secondary" /> Dept:
              </span>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={handleDepartmentChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-[180px] sm:w-[220px] text-xs h-9 font-medium" id="select-filter-dept">
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Departemen</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Ringkasan Progres Penilaian (Card dengan top gradient & progress emerald) */}
      {selectedPeriode ? (
        <Card className="border border-border/80 shadow-xs overflow-hidden relative border-t-4 border-t-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <ClipboardList className="size-4 text-emerald-600" />
                  Progres Penilaian: {selectedPeriode.nama}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Status periode saat ini:{" "}
                  <Badge
                    variant={selectedPeriode.status === "open" ? "default" : "secondary"}
                    className={
                      selectedPeriode.status === "open"
                        ? "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-medium text-[11px] ml-1"
                        : "text-[11px] ml-1"
                    }
                  >
                    {selectedPeriode.status === "open" ? "Terbuka (Open)" : "Ditutup (Closed)"}
                  </Badge>
                </CardDescription>
              </div>

              {/* Progress Count Badge */}
              <div className="flex items-baseline gap-1.5 self-start sm:self-center">
                <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                  {summary.submittedCount}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  / {summary.totalMembers} selesai ({summary.percentage}%)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress bar emerald */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Capaian Penilaian</span>
                <span className="font-semibold text-foreground">
                  {summary.submittedCount} dari {summary.totalMembers} anggota sudah dinilai
                </span>
              </div>
              <Progress
                value={summary.percentage}
                className="h-2.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-emerald-600 transition-all"
              />
            </div>

            {/* Breakdown Mini Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> {summary.submittedCount} Selesai / Terkirim
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                <FileEdit className="size-3.5 text-slate-600" /> {summary.draftCount} Masih Draf
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 font-medium border border-orange-200 dark:border-orange-900">
                <AlertCircle className="size-3.5 text-orange-600" /> {summary.unassessedCount} Belum Dinilai
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          Belum ada periode penilaian aktif yang dipilih.
        </Card>
      )}

      {/* 3. Filter Pencarian & Status Tab */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIP, atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        {/* Filter Pill Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={`h-8 text-xs ${statusFilter === "all" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Semua ({members.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "unassessed" ? "default" : "outline"}
            onClick={() => setStatusFilter("unassessed")}
            className={`h-8 text-xs ${statusFilter === "unassessed" ? "bg-orange-600 text-white" : ""}`}
          >
            Belum Dinilai ({summary.unassessedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "draft" ? "default" : "outline"}
            onClick={() => setStatusFilter("draft")}
            className={`h-8 text-xs ${statusFilter === "draft" ? "bg-slate-700 text-white" : ""}`}
          >
            Draf ({summary.draftCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "submitted" ? "default" : "outline"}
            onClick={() => setStatusFilter("submitted")}
            className={`h-8 text-xs ${statusFilter === "submitted" ? "bg-emerald-600 text-white" : ""}`}
          >
            Sudah Dinilai ({summary.submittedCount})
          </Button>
        </div>
      </div>

      {/* 4. Daftar Anggota & Status Penilaian */}
      {filteredMembers.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm font-medium text-muted-foreground">
            Tidak ada anggota yang sesuai dengan kriteria filter.
          </p>
        </Card>
      ) : (
        <>
          {/* Tampilan Desktop (Table) */}
          <div className="hidden md:block rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[30%]">Anggota</TableHead>
                  <TableHead className="w-[20%]">Departemen</TableHead>
                  <TableHead className="w-[20%]">Status Penilaian</TableHead>
                  <TableHead className="w-[15%]">Skor Akhir</TableHead>
                  <TableHead className="w-[15%] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {member.nama}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.nip ? `NIP: ${member.nip} • ` : ""}
                        {member.jabatan}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-foreground">
                        {member.department_nama}
                      </span>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        {member.department_kode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell>
                      <SkorBadge skor={member.skor_rata} />
                    </TableCell>
                    <TableCell className="text-right">
                      {member.can_edit ? (
                        <Button
                          asChild
                          size="sm"
                          variant={member.status === "unassessed" ? "default" : "outline"}
                          className={
                            member.status === "unassessed"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                              : "h-8 text-xs font-medium"
                          }
                          data-testid={`btn-nilai-${member.id}`}
                        >
                          <Link
                            href={`/penilaian/${member.id}${
                              selectedPeriode ? `?periodeId=${selectedPeriode.id}` : ""
                            }`}
                          >
                            {member.status === "unassessed" ? (
                              <>
                                Nilai Anggota <ArrowRight className="ml-1 size-3.5" />
                              </>
                            ) : (
                              <>
                                Ubah Penilaian <FileEdit className="ml-1 size-3.5" />
                              </>
                            )}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Hanya Lihat
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Tampilan Mobile Card (Optimal untuk Viewport 360px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="border border-border/80 shadow-2xs p-3.5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {member.nama}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.nip ? `${member.nip} • ` : ""}
                      {member.jabatan}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {member.department_nama}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={member.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-0.5">
                      Skor Akhir:
                    </span>
                    <SkorBadge skor={member.skor_rata} />
                  </div>

                  {member.can_edit && (
                    <Button
                      asChild
                      size="sm"
                      variant={member.status === "unassessed" ? "default" : "outline"}
                      className={
                        member.status === "unassessed"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                          : "h-8 text-xs font-medium"
                      }
                      data-testid={`btn-nilai-mobile-${member.id}`}
                    >
                      <Link
                        href={`/penilaian/${member.id}${
                          selectedPeriode ? `?periodeId=${selectedPeriode.id}` : ""
                        }`}
                      >
                        {member.status === "unassessed" ? "Nilai" : "Ubah"}
                        <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
