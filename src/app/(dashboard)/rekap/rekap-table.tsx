"use client"

import React, { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { StatusBadge } from "@/components/penilaian/status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  bulkApproveAssessmentsAction,
  bulkApproveAllSubmittedAction,
  RekapTableItem,
} from "@/lib/actions/rekap"
import { AssessmentPeriod, UserRole } from "@/types/database"
import { formatDateId } from "@/lib/date"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowRight,
  RefreshCw,
  FileQuestion,
  RotateCcw,
  Building,
  Calendar,
  Layers,
  User,
  X,
  CheckCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react"

interface RekapTableProps {
  data: RekapTableItem[]
  totalCount: number
  pageCount: number
  currentPage: number
  pageSize: number
  periods: AssessmentPeriod[]
  selectedPeriodId: string | null
  departments: Array<{ id: string; nama: string; kode: string }>
  selectedDepartmentId: string | null
  currentStatus: string
  currentSearch: string
  userRole: UserRole
}

// Helper untuk merapikan nama periode agar tidak mengulang kata "Periode Penilaian"
function formatPeriodDisplay(name: string): string {
  if (!name) return ""
  return name.replace(/^Periode\s+Penilaian\s+/i, "").trim()
}

export function RekapTable({
  data,
  totalCount,
  pageCount,
  currentPage,
  pageSize,
  periods,
  selectedPeriodId,
  departments,
  selectedDepartmentId,
  currentStatus,
  currentSearch,
  userRole,
}: RekapTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = React.useState(currentSearch)

  // Update query params helper
  const updateQuery = React.useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      for (const [key, val] of Object.entries(newParams)) {
        if (val === null || val === "" || val === "all") {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  // Handle debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateQuery({ search: searchInput || null, page: "1" })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, currentSearch, updateQuery])

  // Cek apakah ada filter aktif selain default
  const hasActiveFilters =
    Boolean(currentSearch) ||
    (currentStatus && currentStatus !== "all") ||
    (selectedDepartmentId && selectedDepartmentId !== "all")

  const handleResetFilters = () => {
    setSearchInput("")
    updateQuery({
      search: null,
      status: null,
      departmentId: null,
      page: "1",
    })
  }

  const canApprove = userRole === "super_admin" || userRole === "admin"
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [isApproving, setIsApproving] = React.useState(false)

  // State untuk terima semua laporan selesai (submitted) pada periode/departemen aktif
  const [bulkAllDialogOpen, setBulkAllDialogOpen] = React.useState(false)
  const [isApprovingAll, setIsApprovingAll] = React.useState(false)

  // Bersihkan pilihan jika data/halaman/filter berganti
  React.useEffect(() => {
    setSelectedIds([])
  }, [selectedPeriodId, selectedDepartmentId, currentPage, currentStatus, currentSearch])

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    setIsApproving(true)
    try {
      const res = await bulkApproveAssessmentsAction(selectedIds)
      if (res.success) {
        toast.success(res.message)
        setSelectedIds([])
        setBulkDialogOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyetujui penilaian.")
    } finally {
      setIsApproving(false)
    }
  }

  const handleBulkApproveAll = async () => {
    setIsApprovingAll(true)
    try {
      const res = await bulkApproveAllSubmittedAction({
        periodId: selectedPeriodId,
        departmentId: selectedDepartmentId,
      })
      if (res.success) {
        toast.success(res.message)
        setBulkAllDialogOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyetujui seluruh laporan.")
    } finally {
      setIsApprovingAll(false)
    }
  }

  // Definisi Kolom TanStack Table
  const columns: ColumnDef<RekapTableItem>[] = React.useMemo(
    () => [
      ...(canApprove
        ? [
            {
              id: "select",
              header: () => {
                const submittedRows = data.filter((item) => item.status === "submitted")
                const isAllSelected =
                  submittedRows.length > 0 &&
                  submittedRows.every((item) => selectedIds.includes(item.id))
                const isSomeSelected =
                  submittedRows.some((item) => selectedIds.includes(item.id)) && !isAllSelected

                return (
                  <div className="flex items-center justify-center pl-1">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds((prev) => {
                            const newSet = new Set(prev)
                            submittedRows.forEach((item) => newSet.add(item.id))
                            return Array.from(newSet)
                          })
                        } else {
                          setSelectedIds((prev) => {
                            const newSet = new Set(prev)
                            submittedRows.forEach((item) => newSet.delete(item.id))
                            return Array.from(newSet)
                          })
                        }
                      }}
                      disabled={submittedRows.length === 0}
                      aria-label="Pilih semua penilaian submitted"
                    />
                  </div>
                )
              },
              cell: ({ row }: { row: { original: RekapTableItem } }) => {
                const isSubmitted = row.original.status === "submitted"
                const isSelected = selectedIds.includes(row.original.id)

                return (
                  <div className="flex items-center justify-center pl-1">
                    <Checkbox
                      checked={isSelected}
                      disabled={!isSubmitted}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) =>
                          checked
                            ? [...prev, row.original.id]
                            : prev.filter((id) => id !== row.original.id)
                        )
                      }}
                      aria-label={`Pilih penilaian ${row.original.member_nama}`}
                      title={
                        isSubmitted
                          ? "Pilih untuk persetujuan massal"
                          : `Status '${row.original.status}' tidak dapat disetujui`
                      }
                    />
                  </div>
                )
              },
            },
          ]
        : []),
      {
        accessorKey: "member_nama",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <SortableHeader
              label="Anggota"
              direction={isSorted}
              onToggle={() => column.toggleSorting(isSorted === "asc")}
            >
              <span className="flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                <span>Anggota</span>
              </span>
            </SortableHeader>
          )
        },
        cell: ({ row }) => {
          const item = row.original
          const initials = item.member_nama
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()

          return (
            <div className="flex items-center gap-3 min-w-[190px]">
              <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground text-xs sm:text-sm truncate leading-tight">
                  {item.member_nama}
                </span>
                <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {item.member_nip ? `NIG: ${item.member_nip}` : "NIG: -"} • {item.member_jabatan}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "department_nama",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <SortableHeader
              label="Departemen"
              direction={isSorted}
              onToggle={() => column.toggleSorting(isSorted === "asc")}
            >
              <span className="flex items-center gap-1.5">
                <Building className="size-3.5 text-muted-foreground" />
                <span>Departemen</span>
              </span>
            </SortableHeader>
          )
        },
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col min-w-[140px] space-y-0.5">
              <span className="text-xs font-medium text-foreground truncate">
                {item.department_nama}
              </span>
              <Badge
                variant="outline"
                className="w-fit text-[10px] font-mono px-1.5 py-0 border-border/80 text-muted-foreground"
              >
                {item.department_kode}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "skor_rata",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <SortableHeader
              label="Skor Rata-rata"
              type="numeric"
              direction={isSorted}
              onToggle={() => column.toggleSorting(isSorted === "asc")}
            />
          )
        },
        cell: ({ row }) => {
          const skor = row.original.skor_rata
          return (
            <div className="min-w-[110px]">
              <SkorBadge skor={skor} showScore={true} />
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <SortableHeader
              label="Status"
              type="general"
              direction={isSorted}
              onToggle={() => column.toggleSorting(isSorted === "asc")}
            />
          )
        },
        cell: ({ row }) => {
          return (
            <div className="min-w-[120px]">
              <StatusBadge status={row.original.status} />
            </div>
          )
        },
      },
      {
        accessorKey: "submitted_at",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <SortableHeader
              label="Tanggal Submit"
              type="date"
              direction={isSorted}
              onToggle={() => column.toggleSorting(isSorted === "asc")}
            />
          )
        },
        cell: ({ row }) => {
          const date = row.original.submitted_at
          return (
            <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[100px] inline-block font-mono">
              {date ? formatDateId(date) : "-"}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          return (
            <div className="flex justify-end pr-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 text-xs font-semibold rounded-md hover:border-primary hover:text-primary transition-colors shadow-2xs"
              >
                <Link href={`/rekap/${row.original.id}`} id={`btn-detail-${row.original.id}`}>
                  <span>Detail</span>
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
          )
        },
      },
    ],
    [canApprove, selectedIds, data]
  )

  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pageCount || 1,
  })

  // Hitung rentang data yang ditampilkan
  const isAll = searchParams.get("pageSize") === "all"
  const startItem = totalCount > 0 ? (isAll ? 1 : (currentPage - 1) * pageSize + 1) : 0
  const endItem = isAll ? totalCount : Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="space-y-4">
      {/* Bar Filter & Pencarian Sisi Server */}
      <div className="p-4 sm:p-5 bg-card/80 backdrop-blur-xs rounded-xl border border-border shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Filter className="size-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Filter &amp; Pencarian Rekap
              </span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-primary/10 text-primary border border-primary/20 font-medium">
                  Filter Aktif
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {canApprove && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setBulkAllDialogOpen(true)}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
                title="Terima seluruh laporan penilaian yang sudah selesai dinilai (status submitted)"
              >
                <CheckCheck className="size-3.5" />
                <span>Terima Semua Selesai</span>
              </Button>
            )}

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-destructive/40 hover:bg-destructive/10 gap-1.5 transition-colors cursor-pointer"
                title="Reset semua filter ke default"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filter</span>
              </Button>
            )}

            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse px-2.5 py-1 rounded-md bg-primary/10">
                <RefreshCw className="size-3 animate-spin text-primary" />
                <span>Memuat data...</span>
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "grid gap-3 sm:gap-4 items-end",
            userRole === "user"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-12"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-12"
          )}
        >
          {/* 1. Filter Periode */}
          <div
            className={cn(
              "space-y-1.5",
              userRole === "user" ? "sm:col-span-1 lg:col-span-5" : "lg:col-span-4"
            )}
          >
            <label
              htmlFor="select-filter-periode"
              className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
            >
              <Calendar className="size-3.5 text-primary" />
              <span>Periode Penilaian</span>
            </label>
            <Select
              value={selectedPeriodId || ""}
              onValueChange={(val) => updateQuery({ periodeId: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-periode" aria-label="Filter periode penilaian" className="h-9.5 text-xs bg-background w-full">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => {
                  const cleanName = formatPeriodDisplay(p.nama)
                  return (
                    <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate font-medium">{cleanName}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                            p.status === "open"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {p.status === "open" ? "Aktif" : "Tutup"}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Filter Departemen (Hanya untuk super_admin & admin) */}
          {userRole !== "user" && (
            <div className="space-y-1.5 lg:col-span-3">
              <label
                htmlFor="select-filter-dept"
                className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
              >
                <Building className="size-3.5 text-primary" />
                <span>Departemen</span>
              </label>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={(val) => updateQuery({ departmentId: val, page: "1" })}
              >
                <SelectTrigger id="select-filter-dept" aria-label="Filter departemen penilaian" className="h-9.5 text-xs bg-background w-full">
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs py-2">
                    Semua Departemen
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs py-2">
                      {d.nama} ({d.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. Filter Status */}
          <div
            className={cn(
              "space-y-1.5",
              userRole === "user" ? "sm:col-span-1 lg:col-span-3" : "lg:col-span-2"
            )}
          >
            <label
              htmlFor="select-filter-status"
              className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
            >
              <Layers className="size-3.5 text-primary" />
              <span>Status Penilaian</span>
            </label>
            <Select
              value={currentStatus || "all"}
              onValueChange={(val) => updateQuery({ status: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-status" aria-label="Filter status penilaian" className="h-9.5 text-xs bg-background w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>Semua Status</span>
                  </div>
                </SelectItem>
                {userRole !== "admin" && (
                  <SelectItem value="draft" className="text-xs py-2">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-slate-400 shrink-0" />
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="submitted" className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Submitted</span>
                  </div>
                </SelectItem>
                <SelectItem value="revision_requested" className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Revision Requested</span>
                  </div>
                </SelectItem>
                <SelectItem value="approved" className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Approved</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Pencarian Nama / NIP */}
          <div
            className={cn(
              "space-y-1.5",
              userRole === "user"
                ? "sm:col-span-2 lg:col-span-4"
                : "sm:col-span-2 lg:col-span-3"
            )}
          >
            <label
              htmlFor="input-search-nama"
              className="text-xs font-medium text-foreground/85 flex items-center gap-1.5"
            >
              <Search className="size-3.5 text-primary" />
              <span>Cari Anggota</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="input-search-nama"
                type="text"
                placeholder="Ketik nama atau NIG..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9.5 pl-9 pr-8 text-xs bg-background w-full"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    updateQuery({ search: null, page: "1" })
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  aria-label="Hapus kata kunci pencarian"
                  title="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data TanStack Table */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold py-3.5 px-4 text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors border-b border-border/60 last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto p-4">
                      <FileQuestion className="size-10 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">Tidak ada penilaian yang sesuai</p>
                      <p className="text-xs text-muted-foreground">
                        Tidak ditemukan data untuk kombinasi filter dan kata kunci pencarian yang dipilih.
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 h-8 text-xs gap-1.5"
                        >
                          <RotateCcw className="size-3" />
                          <span>Hapus Filter</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Kontrol Paginasi Sisi Server */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
        <div className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{startItem}</span> -{" "}
          <span className="font-semibold text-foreground">{endItem}</span> dari{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> penilaian
        </div>

        <div className="flex items-center gap-3">
          {/* Pilihan Baris per Halaman */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Baris:</span>
            <Select
              value={isAll ? "all" : String(pageSize)}
              onValueChange={(val) => updateQuery({ pageSize: val, page: "1" })}
            >
              <SelectTrigger className="h-8 w-28 text-xs bg-card" aria-label="Pilih jumlah baris per halaman">
                <SelectValue placeholder={isAll ? "Semua data" : String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-xs">5</SelectItem>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">Semua data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tombol Navigasi Halaman */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: "1" })}
              disabled={isAll || currentPage <= 1 || isPending}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage - 1) })}
              disabled={isAll || currentPage <= 1 || isPending}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <span className="px-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
              {isAll ? "1 / 1" : `${currentPage} / ${Math.max(pageCount, 1)}`}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage + 1) })}
              disabled={isAll || currentPage >= pageCount || isPending}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(pageCount) })}
              disabled={isAll || currentPage >= pageCount || isPending}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {canApprove && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 border border-border/20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-xs font-semibold">
              {selectedIds.length} penilaian berstatus &apos;submitted&apos; dipilih
            </span>
          </div>
          <div className="h-4 w-px bg-muted-foreground/30" />
          <Button
            size="sm"
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 gap-1.5 shadow-sm"
            onClick={() => setBulkDialogOpen(true)}
            disabled={isApproving}
          >
            <CheckCheck className="size-3.5" />
            <span>Setujui Terpilih</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-background hover:bg-white/10 text-xs h-8 px-2"
            onClick={() => setSelectedIds([])}
            disabled={isApproving}
          >
            Batal
          </Button>
        </div>
      )}

      {/* Dialog Konfirmasi Bulk Approval */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="size-5 text-emerald-600" />
              <span>Konfirmasi Persetujuan Massal</span>
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui secara massal <strong>{selectedIds.length}</strong> penilaian kinerja yang telah dipilih?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5 border border-border">
            <p className="font-medium text-foreground">
              Ketentuan persetujuan:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Status seluruh penilaian yang dipilih akan berubah menjadi <strong>Disetujui (Approved)</strong>.</li>
              <li>Aksi ini dilakukan dalam kapasitas Anda sebagai verifikator/penerima laporan.</li>
              <li>Riwayat audit log persetujuan akan tercatat otomatis di sistem.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkDialogOpen(false)}
              disabled={isApproving}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleBulkApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="size-3.5 mr-1.5" />
                  <span>Ya, Setujui {selectedIds.length} Penilaian</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Terima Semua Laporan Selesai */}
      <Dialog open={bulkAllDialogOpen} onOpenChange={setBulkAllDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <CheckCheck className="size-5 text-emerald-600" />
              <span>Terima Semua Laporan Selesai</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground pt-1">
              Aksi ini akan menyetujui (status <strong>Disetujui / Approved</strong>) seluruh laporan penilaian kinerja yang saat ini berstatus <strong>Submitted</strong> pada lingkup periode terpilih
              {selectedDepartmentId ? " dan departemen terkait" : " lintas seluruh departemen"}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg text-xs space-y-1.5 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Persetujuan Massal Langsung
            </p>
            <p className="text-muted-foreground dark:text-emerald-300/80">
              Seluruh laporan yang berstatus &quot;submitted&quot; akan langsung disetujui tanpa harus memilih baris satu per satu di setiap halaman.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkAllDialogOpen(false)}
              disabled={isApprovingAll}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-2xs"
              onClick={handleBulkApproveAll}
              disabled={isApprovingAll}
            >
              {isApprovingAll ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyetujui Semua...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="size-3.5" />
                  <span>Ya, Terima Semua Selesai</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
