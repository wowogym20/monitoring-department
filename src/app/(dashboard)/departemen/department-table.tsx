"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
  Building2,
  Plus,
  Search,
  X,
  MoreHorizontal,
  Edit,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
} from "lucide-react"
import { formatDateJakarta } from "@/lib/date"
import { cn } from "@/lib/utils"
import {
  createDepartmentAction,
  updateDepartmentAction,
  assignKetuaAction,
  toggleDepartmentStatusAction,
  deleteDepartmentAction,
  type DepartmentListItem,
  type DepartmentCompletionSummary,
} from "@/lib/actions/department"
import { UserRole } from "@/types/database"

interface DepartmentTableProps {
  initialData: DepartmentListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  currentUserRole: UserRole
  eligibleKetua: Array<{ id: string; nama: string; no_hp: string | null }>
  summary?: DepartmentCompletionSummary
  activePeriodName?: string | null
  currentFillingStatus?: string
  currentPageSize?: string
}

export function DepartmentTable({
  initialData,
  total,
  page,
  pageSize,
  totalPages,
  currentUserRole,
  eligibleKetua,
  summary,
  activePeriodName,
  currentFillingStatus = "all",
  currentPageSize = "10",
}: DepartmentTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isSuperAdmin = currentUserRole === "super_admin"

  // URL State controls
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get("search") || ""
  )
  const currentStatus = searchParams.get("status") || "all"

  // Dialog State
  const [addOpen, setAddOpen] = React.useState(false)
  const [editDept, setEditDept] = React.useState<DepartmentListItem | null>(null)
  const [assignDept, setAssignDept] = React.useState<DepartmentListItem | null>(null)
  const [deleteDept, setDeleteDept] = React.useState<DepartmentListItem | null>(null)

  // Form Fields State
  const [nama, setNama] = React.useState("")
  const [kode, setKode] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [selectedKetuaId, setSelectedKetuaId] = React.useState<string>("unassigned")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Debounced search to URL
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue.trim()) {
        params.set("search", searchValue.trim())
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      router.push(`/departemen?${params.toString()}`)
    }, 400)

    return () => clearTimeout(handler)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusFilterChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val !== "all") {
      params.set("status", val)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/departemen?${params.toString()}`)
  }

  const currentFillingStatusParam = searchParams.get("fillingStatus") || currentFillingStatus || "all"
  const pageSizeValue = searchParams.get("pageSize") || currentPageSize || "10"
  const isAll = pageSizeValue === "all" || pageSizeValue === "semua"

  const handleFillingStatusFilterChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val !== "all") {
      params.set("fillingStatus", val)
    } else {
      params.delete("fillingStatus")
    }
    params.set("page", "1")
    router.push(`/departemen?${params.toString()}`)
  }

  const handlePageSizeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val === "10") {
      params.delete("pageSize")
    } else {
      params.set("pageSize", val)
    }
    params.set("page", "1")
    router.push(`/departemen?${params.toString()}`)
  }

  const renderFillingStatusBadge = React.useCallback((dept: DepartmentListItem) => {
    if (dept.filling_status === "completed") {
      return (
        <div className="flex flex-col space-y-0.5 min-w-[130px]">
          <Badge
            variant="default"
            className="w-fit bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white text-[11px] px-2 py-0.5 font-medium"
          >
            <CheckCircle2 className="size-3 mr-1 shrink-0" />
            <span>Sudah Mengisi</span>
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">
            {dept.assessed_count} / {dept.total_members} dinilai
          </span>
        </div>
      )
    }

    if (dept.filling_status === "partial") {
      return (
        <div className="flex flex-col space-y-0.5 min-w-[130px]">
          <Badge
            variant="outline"
            className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] px-2 py-0.5 font-medium"
          >
            <AlertCircle className="size-3 mr-1 shrink-0" />
            <span>Sebagian</span>
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">
            {dept.assessed_count} / {dept.total_members} dinilai{dept.draft_count > 0 ? ` (${dept.draft_count} draf)` : ""}
          </span>
        </div>
      )
    }

    return (
      <div className="flex flex-col space-y-0.5 min-w-[130px]">
        <Badge
          variant="secondary"
          className="w-fit bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground text-[11px] px-2 py-0.5 font-medium"
        >
          <XCircle className="size-3 mr-1 shrink-0" />
          <span>Belum Mengisi</span>
        </Badge>
        <span className="text-[11px] text-muted-foreground font-mono">
          0 / {dept.total_members} dinilai
        </span>
      </div>
    )
  }, [])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`/departemen?${params.toString()}`)
  }

  const currentSortBy = searchParams.get("sortBy") || "nama"
  const currentSort = (searchParams.get("sort") === "desc" ? "desc" : "asc") as "asc" | "desc"

  const handleSortToggle = React.useCallback(
    (col: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (currentSortBy === col) {
        const nextSort = currentSort === "asc" ? "desc" : "asc"
        params.set("sort", nextSort)
      } else {
        params.set("sortBy", col)
        params.set("sort", "asc")
      }
      params.set("page", "1")
      router.push(`/departemen?${params.toString()}`)
    },
    [currentSortBy, currentSort, router, searchParams]
  )

  // Action: Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createDepartmentAction({
        nama,
        kode,
        is_active: isActive,
      })
      if (res.success) {
        toast.success(res.message)
        setAddOpen(false)
        setNama("")
        setKode("")
        setIsActive(true)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Update Department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDept) return
    setIsSubmitting(true)
    try {
      const res = await updateDepartmentAction({
        id: editDept.id,
        nama,
        kode,
        is_active: isActive,
      })
      if (res.success) {
        toast.success(res.message)
        setEditDept(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Assign Ketua
  const handleAssignKetua = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignDept) return
    setIsSubmitting(true)
    try {
      const ketuaIdValue =
        selectedKetuaId === "unassigned" ? null : selectedKetuaId

      const res = await assignKetuaAction({
        department_id: assignDept.id,
        ketua_id: ketuaIdValue,
      })
      if (res.success) {
        toast.success(res.message)
        setAssignDept(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan saat menetapkan ketua")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Toggle Status Quick
  const handleToggleStatus = React.useCallback(async (dept: DepartmentListItem) => {
    try {
      const nextStatus = !dept.is_active
      const res = await toggleDepartmentStatusAction(dept.id, nextStatus)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status departemen")
    }
  }, [router])

  // Action: Delete Department
  const handleDeleteDepartment = async () => {
    if (!deleteDept) return
    setIsSubmitting(true)
    try {
      const res = await deleteDepartmentAction(deleteDept.id)
      if (res.success) {
        toast.success(res.message)
        setDeleteDept(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menghapus departemen")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = React.useCallback((active: boolean) => (
    <Badge
      variant={active ? "default" : "secondary"}
      className={
        active
          ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
          : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
      }
    >
      {active ? (
        <>
          <CheckCircle2 className="size-3 mr-1 shrink-0" />
          <span>Aktif</span>
        </>
      ) : (
        <>
          <XCircle className="size-3 mr-1 shrink-0" />
          <span>Nonaktif</span>
        </>
      )}
    </Badge>
  ), [])

  const renderActionMenu = React.useCallback(
    (dept: DepartmentListItem) => {
      if (!isSuperAdmin) return null
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 p-0"
              aria-label="Menu Aksi"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setEditDept(dept)
                setNama(dept.nama)
                setKode(dept.kode)
                setIsActive(dept.is_active)
              }}
            >
              <Edit className="size-4 mr-2" />
              Ubah Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setAssignDept(dept)
                setSelectedKetuaId(dept.ketua_id || "unassigned")
              }}
            >
              <UserCheck className="size-4 mr-2" />
              Pilih/Ganti Ketua
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(dept)}>
              {dept.is_active ? (
                <>
                  <XCircle className="size-4 mr-2 text-amber-600" />
                  Nonaktifkan
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2 text-emerald-600" />
                  Aktifkan
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleteDept(dept)}
            >
              <Trash2 className="size-4 mr-2" />
              Hapus Permanen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    [isSuperAdmin, handleToggleStatus]
  )

  // Column definitions for TanStack Table
  const columns = React.useMemo<ColumnDef<DepartmentListItem>[]>(
    () => [
      {
        id: "index",
        header: () => <div className="text-center">No.</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono text-xs text-muted-foreground">
            {(page - 1) * pageSize + row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "nama",
        header: () => (
          <SortableHeader
            label="Departemen"
            direction={currentSortBy === "nama" ? currentSort : false}
            onToggle={() => handleSortToggle("nama")}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            <div className="flex items-center gap-2">
              <span>{row.original.nama}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Dibuat: {formatDateJakarta(row.original.created_at)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "kode",
        header: () => (
          <SortableHeader
            label="Kode"
            direction={currentSortBy === "kode" ? currentSort : false}
            onToggle={() => handleSortToggle("kode")}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="font-mono text-xs uppercase bg-muted/50 border-border"
          >
            {row.original.kode}
          </Badge>
        ),
      },
      {
        accessorKey: "ketua",
        header: "Ketua Departemen",
        cell: ({ row }) => {
          const ketua = row.original.ketua
          return (
            <div className="flex items-center gap-2">
              {ketua ? (
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ketua.nama}
                  </p>
                  {ketua.no_hp && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {ketua.no_hp}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs italic text-muted-foreground">
                  Belum ditentukan
                </span>
              )}
              {isSuperAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  onClick={() => {
                    setAssignDept(row.original)
                    setSelectedKetuaId(row.original.ketua_id || "unassigned")
                  }}
                >
                  <UserCheck className="size-3.5 mr-1" />
                  {ketua ? "Ganti" : "Pilih"}
                </Button>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "filling_status",
        header: "Status Pengisian",
        cell: ({ row }) => renderFillingStatusBadge(row.original),
      },
      {
        accessorKey: "is_active",
        header: () => (
          <SortableHeader
            label="Status"
            type="general"
            direction={currentSortBy === "is_active" ? currentSort : false}
            onToggle={() => handleSortToggle("is_active")}
          />
        ),
        cell: ({ row }) => renderStatusBadge(row.original.is_active),
      },
      ...(isSuperAdmin
        ? [
            {
              id: "actions",
              header: "Aksi",
              cell: ({ row }: { row: { original: DepartmentListItem } }) =>
                renderActionMenu(row.original),
            },
          ]
        : []),
    ],
    [
      isSuperAdmin,
      page,
      pageSize,
      currentSortBy,
      currentSort,
      handleSortToggle,
      renderStatusBadge,
      renderFillingStatusBadge,
      renderActionMenu,
    ]
  )

  const table = useReactTable({
    data: initialData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-4">
      {/* Kartu Ringkasan Kepatuhan Pengisian Penilaian Departemen */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground font-medium">Total Departemen</span>
              <p className="text-xl font-bold text-foreground">{summary.total}</p>
              {summary.periodName && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px] block">
                  Periode: {summary.periodName}
                </span>
              )}
            </div>
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
          </Card>

          <Card className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Sudah Mengisi Lengkap</span>
              <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{summary.completed}</p>
              <span className="text-[10px] text-muted-foreground">100% anggota dinilai</span>
            </div>
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
          </Card>

          <Card className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Belum Lengkap / Belum Mengisi</span>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-300">{summary.partial + summary.unfilled}</p>
              <span className="text-[10px] text-muted-foreground">{summary.unfilled} belum mengisi sama sekali</span>
            </div>
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="size-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Search, Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="search-departemen"
              aria-label="Cari nama atau kode departemen"
              placeholder="Cari nama atau kode departemen..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8 pr-8 text-sm"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("")
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("search")
                  params.set("page", "1")
                  router.push(`/departemen?${params.toString()}`)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                aria-label="Hapus kata kunci pencarian"
                title="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Select
            value={currentFillingStatusParam}
            onValueChange={handleFillingStatusFilterChange}
          >
            <SelectTrigger className="w-36 sm:w-44 text-sm shrink-0" aria-label="Filter status pengisian">
              <SelectValue placeholder="Status Pengisian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pengisian</SelectItem>
              <SelectItem value="completed">Sudah Mengisi</SelectItem>
              <SelectItem value="partial">Sebagian</SelectItem>
              <SelectItem value="unfilled">Belum Mengisi</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentStatus}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-32 sm:w-36 text-sm shrink-0" aria-label="Filter status departemen">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif Saja</SelectItem>
              <SelectItem value="inactive">Nonaktif Saja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={() => {
              setNama("")
              setKode("")
              setIsActive(true)
              setAddOpen(true)
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
          >
            <Plus className="size-4 mr-1.5" />
            Tambah Departemen
          </Button>
        )}
      </div>

      {/* Tampilan Desktop (>= md): TanStack Table */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "font-semibold",
                      header.column.id === "index" && "w-14 text-center px-2"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === "index" && "text-center px-2"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada departemen yang sesuai kriteria pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Mobile (< md): Kartu Menyusun ke Bawah (Tanpa Horizontal Scroll) */}
      <div className="space-y-3 md:hidden">
        {initialData.length > 0 ? (
          initialData.map((dept, idx) => {
            const rowNumber = (page - 1) * pageSize + idx + 1
            return (
              <Card
                key={dept.id}
                className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3 gap-0"
              >
                {/* Header Kartu: Nomor, Kode, Status & Tombol Aksi */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      #{rowNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs uppercase bg-muted/50 border-border"
                    >
                      {dept.kode}
                    </Badge>
                    {renderStatusBadge(dept.is_active)}
                  </div>
                  {isSuperAdmin && (
                    <div className="shrink-0 -mr-1">
                      {renderActionMenu(dept)}
                    </div>
                  )}
                </div>

                {/* Departemen & Info Dibuat */}
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm text-foreground break-words leading-snug">
                    {dept.nama}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Dibuat: {formatDateJakarta(dept.created_at)}
                  </p>
                </div>

                {/* Ketua Departemen */}
                <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-muted-foreground block font-medium mb-0.5">
                      Ketua Departemen
                    </span>
                    {dept.ketua ? (
                      <div>
                        <p className="text-xs font-medium text-foreground truncate">
                          {dept.ketua.nama}
                        </p>
                        {dept.ketua.no_hp && (
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {dept.ketua.no_hp}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">
                        Belum ditentukan
                      </span>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 shrink-0"
                      onClick={() => {
                        setAssignDept(dept)
                        setSelectedKetuaId(dept.ketua_id || "unassigned")
                      }}
                    >
                      <UserCheck className="size-3.5 mr-1" />
                      {dept.ketua ? "Ganti" : "Pilih"}
                    </Button>
                  )}
                </div>

                {/* Status Pengisian Penilaian */}
                <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Status Pengisian
                  </span>
                  <div>
                    {renderFillingStatusBadge(dept)}
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm font-medium text-muted-foreground">
              Tidak ada departemen yang sesuai kriteria pencarian.
            </p>
          </Card>
        )}
      </div>

      {/* Server Pagination Footer with Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <p>
            {isAll
              ? `Menampilkan seluruh ${total} departemen`
              : `Menampilkan baris ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, total)} dari total ${total} departemen`}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Tampilkan:</span>
            <Select value={pageSizeValue} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-7 w-24 text-xs bg-background" aria-label="Pilih jumlah baris per halaman">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-xs">5</SelectItem>
                <SelectItem value="10" className="text-xs">10 (Default)</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">Semua</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[11px]">baris</span>
          </div>
        </div>

        {!isAll && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Sebelumnya
            </Button>
            <span className="px-2 font-medium">
              Halaman {page} dari {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 px-2.5 text-xs"
            >
              Berikutnya
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* DIALOG 1: Tambah Departemen */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Tambah Departemen Baru
            </DialogTitle>
            <DialogDescription>
              Masukkan nama lengkap departemen dan kode singkat unik (misal: PEND-AJAR).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDepartment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-nama">Nama Departemen</Label>
              <Input
                id="add-nama"
                required
                placeholder="Contoh: Dept. Pekerjaan Umum"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-kode">Kode Singkat (Unik)</Label>
              <Input
                id="add-kode"
                required
                placeholder="Contoh: PU"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                className="font-mono uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Hanya huruf, angka, underscore, atau tanda hubung (-).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="add-active">Status Aktif</Label>
                <p className="text-xs text-muted-foreground">
                  Departemen aktif dapat dinilai dalam periode penilaian.
                </p>
              </div>
              <Switch
                id="add-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Simpan Departemen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Ubah Departemen */}
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-primary" />
              Ubah Data Departemen
            </DialogTitle>
            <DialogDescription>
              Perbarui rincian informasi nama, kode, atau status keaktifan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDepartment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nama">Nama Departemen</Label>
              <Input
                id="edit-nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-kode">Kode Singkat (Unik)</Label>
              <Input
                id="edit-kode"
                required
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                className="font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-active">Status Aktif</Label>
                <p className="text-xs text-muted-foreground">
                  Departemen aktif dapat dinilai dalam periode penilaian.
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDept(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Perbarui Departemen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Pilih / Ganti Ketua Departemen */}
      <Dialog
        open={!!assignDept}
        onOpenChange={(open) => !open && setAssignDept(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              Pilih atau Ganti Ketua Departemen
            </DialogTitle>
            <DialogDescription>
              Tentukan ketua untuk <strong>{assignDept?.nama}</strong>. Mengganti ketua
              tidak akan menghapus riwayat penilaian lama.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignKetua} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="select-ketua">Akun Ketua Departemen</Label>
              <Select
                value={selectedKetuaId}
                onValueChange={setSelectedKetuaId}
              >
                <SelectTrigger id="select-ketua" className="w-full">
                  <SelectValue placeholder="Pilih akun ketua..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    (Kosongkan / Tanpa Ketua)
                  </SelectItem>
                  {eligibleKetua.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} {k.no_hp ? `(${k.no_hp})` : ""}
                    </SelectItem>
                  ))}
                  {/* Jika ketua saat ini tidak ada di eligible (misal sudah assigned), pastikan tetap bisa dipilih */}
                  {assignDept?.ketua &&
                    !eligibleKetua.some((k) => k.id === assignDept.ketua?.id) && (
                      <SelectItem value={assignDept.ketua.id}>
                        {assignDept.ketua.nama} (Ketua Saat Ini)
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hanya menampilkan akun dengan peran &apos;user&apos; yang belum memegang departemen lain.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignDept(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Simpan Penugasan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Konfirmasi Hapus Departemen */}
      <Dialog
        open={!!deleteDept}
        onOpenChange={(open) => !open && setDeleteDept(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              Hapus Departemen Permanen
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus departemen{" "}
              <strong>{deleteDept?.nama}</strong> ({deleteDept?.kode})?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
            <strong>Perhatian:</strong> Departemen yang sudah memiliki riwayat penilaian
            atau anggota TIDAK dapat dihapus permanen. Gunakan fitur nonaktifkan jika
            departemen tidak lagi aktif.
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDept(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
