"use client"

import React, { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
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
import { RekapTableItem } from "@/lib/actions/rekap"
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

  // Definisi Kolom TanStack Table
  const columns: ColumnDef<RekapTableItem>[] = React.useMemo(
    () => [
      {
        accessorKey: "member_nama",
        header: () => (
          <span className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <span>Anggota</span>
          </span>
        ),
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
                  {item.member_nip ? `NIP: ${item.member_nip}` : "NIP: -"} • {item.member_jabatan}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "department_nama",
        header: () => (
          <span className="flex items-center gap-1.5">
            <Building className="size-3.5 text-muted-foreground" />
            <span>Departemen</span>
          </span>
        ),
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
        header: "Skor Rata-rata",
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
        header: "Status",
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
        header: "Tanggal Submit",
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
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount || 1,
  })

  // Hitung rentang data yang ditampilkan
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="space-y-4">
      {/* Bar Filter & Pencarian Sisi Server */}
      <div className="p-4 sm:p-5 bg-card/80 backdrop-blur-xs rounded-xl border border-border shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Filter & Pencarian Rekap</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Filter Aktif
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>
            )}

            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <RefreshCw className="size-3 animate-spin text-primary" />
                Memuat data...
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Filter Periode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              <span>Periode Penilaian</span>
            </label>
            <Select
              value={selectedPeriodId || ""}
              onValueChange={(val) => updateQuery({ periodeId: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-periode" className="h-9 text-xs bg-background">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.nama} {p.status === "open" ? "(Aktif)" : "(Tutup)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Filter Departemen (Hanya untuk super_admin & admin) */}
          {userRole !== "user" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Building className="size-3" />
                <span>Departemen</span>
              </label>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={(val) => updateQuery({ departmentId: val, page: "1" })}
              >
                <SelectTrigger id="select-filter-dept" className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Semua Departemen
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.nama} ({d.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. Filter Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Layers className="size-3" />
              <span>Status Penilaian</span>
            </label>
            <Select
              value={currentStatus || "all"}
              onValueChange={(val) => updateQuery({ status: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-status" className="h-9 text-xs bg-background">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Status
                </SelectItem>
                {userRole !== "admin" && (
                  <SelectItem value="draft" className="text-xs">
                    Draft
                  </SelectItem>
                )}
                <SelectItem value="submitted" className="text-xs">
                  Submitted
                </SelectItem>
                <SelectItem value="revision_requested" className="text-xs">
                  Revision Requested
                </SelectItem>
                <SelectItem value="approved" className="text-xs">
                  Approved
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Pencarian Nama / NIP */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Search className="size-3" />
              <span>Cari Anggota</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="input-search-nama"
                type="text"
                placeholder="Ketik nama atau NIP..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 pl-9 text-xs bg-background"
              />
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
              value={String(pageSize)}
              onValueChange={(val) => updateQuery({ pageSize: val, page: "1" })}
            >
              <SelectTrigger className="h-8 w-18 text-xs bg-card">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
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
              disabled={currentPage <= 1 || isPending}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1 || isPending}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <span className="px-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
              {currentPage} / {Math.max(pageCount, 1)}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage + 1) })}
              disabled={currentPage >= pageCount || isPending}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(pageCount) })}
              disabled={currentPage >= pageCount || isPending}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
