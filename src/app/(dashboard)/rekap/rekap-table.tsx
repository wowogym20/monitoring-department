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

  // Definisi Kolom TanStack Table
  const columns: ColumnDef<RekapTableItem>[] = React.useMemo(
    () => [
      {
        accessorKey: "member_nama",
        header: "Anggota",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col min-w-[160px]">
              <span className="font-semibold text-foreground text-sm">
                {item.member_nama}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.member_nip ? `NIP: ${item.member_nip}` : "NIP: -"} • {item.member_jabatan}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "department_nama",
        header: "Departemen",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col min-w-[130px]">
              <span className="text-xs font-medium text-foreground">
                {item.department_nama}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {item.department_kode}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "skor_rata",
        header: "Skor Rata-rata",
        cell: ({ row }) => {
          const skor = row.original.skor_rata
          return <SkorBadge skor={skor} showScore={true} />
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          return <StatusBadge status={row.original.status} />
        },
      },
      {
        accessorKey: "submitted_at",
        header: "Tanggal Submit",
        cell: ({ row }) => {
          const date = row.original.submitted_at
          return (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
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
            <div className="flex justify-end">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs hover:border-primary hover:text-primary"
              >
                <Link href={`/rekap/${row.original.id}`} id={`btn-detail-${row.original.id}`}>
                  <span>Detail</span>
                  <ArrowRight className="size-3.5" />
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
      <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border border-border shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="size-4 text-primary" />
            <span>Filter Rekapitulasi</span>
          </div>
          {isPending && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <RefreshCw className="size-3 animate-spin" />
              Memuat data...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Filter Periode */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Periode</label>
            <Select
              value={selectedPeriodId || ""}
              onValueChange={(val) => updateQuery({ periodeId: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-periode" className="h-9 text-xs">
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Departemen</label>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={(val) => updateQuery({ departmentId: val, page: "1" })}
              >
                <SelectTrigger id="select-filter-dept" className="h-9 text-xs">
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={currentStatus || "all"}
              onValueChange={(val) => updateQuery({ status: val, page: "1" })}
            >
              <SelectTrigger id="select-filter-status" className="h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Status
                </SelectItem>
                {userRole !== "admin" && (
                  <SelectItem value="draft" className="text-xs">
                    Draf
                  </SelectItem>
                )}
                <SelectItem value="submitted" className="text-xs">
                  Submitted
                </SelectItem>
                <SelectItem value="revision_requested" className="text-xs">
                  Perlu Revisi
                </SelectItem>
                <SelectItem value="approved" className="text-xs">
                  Disetujui
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Pencarian Nama / NIP */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="input-search-nama"
                type="text"
                placeholder="Cari nama / NIP anggota..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data TanStack Table */}
      <div className="rounded-md border border-border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold py-3">
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
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileQuestion className="size-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">Tidak ada data penilaian yang ditemukan.</p>
                    <p className="text-xs text-muted-foreground">
                      Coba sesuaikan filter departemen, status, atau kata kunci pencarian.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Kontrol Paginasi Sisi Server */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{startItem}</span> -{" "}
          <span className="font-semibold text-foreground">{endItem}</span> dari{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> penilaian
        </div>

        <div className="flex items-center gap-2">
          {/* Pilihan Page Size */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <span>Baris per halaman:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => updateQuery({ pageSize: val, page: "1" })}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tombol Halaman */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: "1" })}
              disabled={currentPage <= 1 || isPending}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1 || isPending}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="px-2 text-xs font-medium text-foreground">
              Hal {currentPage} dari {Math.max(pageCount, 1)}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(currentPage + 1) })}
              disabled={currentPage >= pageCount || isPending}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuery({ page: String(pageCount) })}
              disabled={currentPage >= pageCount || isPending}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
