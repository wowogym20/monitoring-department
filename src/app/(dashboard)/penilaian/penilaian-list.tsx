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
import { SortableHeader } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ArrowRight,
  ClipboardList,
  Filter,
  RefreshCw,
  X,
} from "lucide-react"

// Helper untuk merapikan nama periode agar tidak mengulang kata "Periode Penilaian"
function formatPeriodDisplay(name: string): string {
  if (!name) return ""
  return name.replace(/^Periode\s+Penilaian\s+/i, "").trim()
}

interface PenilaianListProps {
  initialData: PenilaianDashboardData
}

export function PenilaianList({ initialData }: PenilaianListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"nama" | "department" | "status" | "skor">("nama")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const handleSort = (col: "nama" | "department" | "status" | "skor") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

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

  // Filter dan sortir anggota berdasarkan pencarian, status, dan kolom yang dipilih
  const filteredMembers = React.useMemo(() => {
    const list = members.filter((member) => {
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

    return list.sort((a, b) => {
      let cmp = 0
      if (sortBy === "nama") {
        cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
      } else if (sortBy === "department") {
        cmp = a.department_nama.localeCompare(b.department_nama, "id", { sensitivity: "base" })
      } else if (sortBy === "status") {
        cmp = a.status.localeCompare(b.status, "id", { sensitivity: "base" })
      } else if (sortBy === "skor") {
        const scoreA = a.skor_rata ?? -1
        const scoreB = b.skor_rata ?? -1
        cmp = scoreA - scoreB
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [members, searchQuery, statusFilter, sortBy, sortOrder])

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <ClipboardList className="size-7 text-primary shrink-0" />
          Penilaian Anggota
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {userRole === "user"
            ? "Evaluasi kinerja berkala untuk seluruh anggota di departemen Anda."
            : "Monitoring dan evaluasi lembar penilaian kinerja anggota seluruh departemen."}
        </p>
      </div>

      {/* 2. Filter Bar (Periode & Departemen) - Responsif di Semua Device */}
      <div className="p-4 sm:p-5 bg-card/90 backdrop-blur-xs rounded-xl border border-border shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Filter className="size-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Filter Penilaian
            </span>
          </div>

          {isPending && (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse px-2.5 py-1 rounded-md bg-primary/10 self-start sm:self-auto">
              <RefreshCw className="size-3 animate-spin text-primary" />
              <span>Memuat data...</span>
            </span>
          )}
        </div>

        <div
          className={cn(
            "grid gap-3 sm:gap-4 items-end",
            userRole === "super_admin" || userRole === "admin"
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:max-w-md"
          )}
        >
          {/* Selector Periode */}
          <div className="space-y-1.5">
            <label
              htmlFor="select-periode"
              className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
            >
              <Calendar className="size-3.5 text-primary" />
              <span>Periode Penilaian</span>
            </label>
            <Select
              value={selectedPeriode?.id || ""}
              onValueChange={handlePeriodChange}
              disabled={isPending || periodeList.length === 0}
            >
              <SelectTrigger
                id="select-periode"
                aria-label="Pilih periode penilaian"
                className="w-full h-9.5 text-xs bg-background"
              >
                <SelectValue placeholder="Pilih Periode...">
                  {selectedPeriode ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate font-medium">
                        {formatPeriodDisplay(selectedPeriode.nama)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-normal px-1.5 py-0 shrink-0",
                          selectedPeriode.status === "open"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {selectedPeriode.status === "open" ? "Buka" : "Tutup"}
                      </Badge>
                    </div>
                  ) : (
                    "Pilih Periode..."
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periodeList.map((p) => {
                  const cleanName = formatPeriodDisplay(p.nama)
                  return (
                    <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium truncate">{cleanName}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-normal px-1.5 py-0 shrink-0",
                            p.status === "open"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {p.status === "open" ? "Buka" : "Tutup"}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selector Departemen (Khusus Admin & Super Admin) */}
          {(userRole === "super_admin" || userRole === "admin") && (
            <div className="space-y-1.5">
              <label
                htmlFor="select-filter-dept"
                className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
              >
                <Building2 className="size-3.5 text-primary" />
                <span>Departemen</span>
              </label>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={handleDepartmentChange}
                disabled={isPending}
              >
                <SelectTrigger
                  id="select-filter-dept"
                  aria-label="Pilih departemen penilaian"
                  className="w-full h-9.5 text-xs bg-background"
                >
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs py-2">
                    Semua Departemen
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs py-2">
                      <span className="font-medium">{d.nama}</span>{" "}
                      <span className="text-muted-foreground text-[10px] font-mono">
                        ({d.kode})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* 3. Ringkasan Progres Penilaian */}
      {selectedPeriode ? (
        <Card className="border border-border/80 shadow-xs overflow-hidden relative border-t-4 border-t-primary">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <ClipboardList className="size-4 text-primary" />
                  Progres Penilaian: {formatPeriodDisplay(selectedPeriode.nama)}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Status periode saat ini:{" "}
                  <Badge
                    variant={selectedPeriode.status === "open" ? "default" : "secondary"}
                    className={
                      selectedPeriode.status === "open"
                        ? "bg-primary/10 text-primary border-primary/20 font-medium text-[11px] ml-1"
                        : "text-[11px] ml-1"
                    }
                  >
                    {selectedPeriode.status === "open" ? "Terbuka (Buka)" : "Ditutup (Tutup)"}
                  </Badge>
                </CardDescription>
              </div>

              {/* Progress Count Badge */}
              <div className="flex items-baseline gap-1.5 self-start sm:self-center">
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {summary.submittedCount}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  / {summary.totalMembers} selesai ({summary.percentage}%)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Capaian Penilaian</span>
                <span className="font-semibold text-foreground">
                  {summary.submittedCount} dari {summary.totalMembers} anggota sudah dinilai
                </span>
              </div>
              <Progress
                value={summary.percentage}
                className="h-2.5 bg-muted [&>div]:bg-primary transition-all"
              />
            </div>

            {/* Breakdown Mini Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                <CheckCircle2 className="size-3.5" /> {summary.submittedCount} Selesai / Terkirim
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium border border-border">
                <FileEdit className="size-3.5 text-muted-foreground" /> {summary.draftCount} Masih Draf
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium border border-amber-500/20">
                <AlertCircle className="size-3.5" /> {summary.unassessedCount} Belum Dinilai
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          Belum ada periode penilaian aktif yang dipilih.
        </Card>
      )}

      {/* 4. Filter Pencarian & Status Tab */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama, NIG, atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 text-xs h-9.5 bg-background w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              aria-label="Hapus kata kunci pencarian"
              title="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pill Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 flex-nowrap sm:flex-wrap">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={cn(
              "h-8 text-xs shrink-0 rounded-lg",
              statusFilter === "all" && "bg-primary text-primary-foreground font-semibold"
            )}
          >
            Semua ({members.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "unassessed" ? "default" : "outline"}
            onClick={() => setStatusFilter("unassessed")}
            className={cn(
              "h-8 text-xs shrink-0 rounded-lg",
              statusFilter === "unassessed" && "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            )}
          >
            Belum Dinilai ({summary.unassessedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "draft" ? "default" : "outline"}
            onClick={() => setStatusFilter("draft")}
            className={cn(
              "h-8 text-xs shrink-0 rounded-lg",
              statusFilter === "draft" && "bg-slate-700 hover:bg-slate-800 text-white font-semibold"
            )}
          >
            Draf ({summary.draftCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "submitted" ? "default" : "outline"}
            onClick={() => setStatusFilter("submitted")}
            className={cn(
              "h-8 text-xs shrink-0 rounded-lg",
              statusFilter === "submitted" && "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            )}
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
                  <TableHead className="w-[30%]">
                    <SortableHeader
                      label="Anggota"
                      direction={sortBy === "nama" ? sortOrder : false}
                      onToggle={() => handleSort("nama")}
                    />
                  </TableHead>
                  <TableHead className="w-[20%]">
                    <SortableHeader
                      label="Departemen"
                      direction={sortBy === "department" ? sortOrder : false}
                      onToggle={() => handleSort("department")}
                    />
                  </TableHead>
                  <TableHead className="w-[20%]">
                    <SortableHeader
                      label="Status Penilaian"
                      type="general"
                      direction={sortBy === "status" ? sortOrder : false}
                      onToggle={() => handleSort("status")}
                    />
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <SortableHeader
                      label="Skor Akhir"
                      type="numeric"
                      direction={sortBy === "skor" ? sortOrder : false}
                      onToggle={() => handleSort("skor")}
                    />
                  </TableHead>
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
                        {member.nip ? `NIG: ${member.nip} • ` : ""}
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
                              ? "bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-xs font-semibold"
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
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-xs font-semibold"
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
