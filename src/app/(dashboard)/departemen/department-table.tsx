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
  Clock,
  RotateCcw,
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
  currentPageSize = "all",
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
  const pageSizeValue = searchParams.get("pageSize") || currentPageSize || "all"
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

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
    currentStatus !== "all" ||
    currentFillingStatusParam !== "all"
  )

  const handleResetFilters = () => {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("status")
    params.delete("fillingStatus")
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
        header: () => (
          <SortableHeader
            label="Kepala Departemen"
            direction={currentSortBy === "ketua" ? currentSort : false}
            onToggle={() => handleSortToggle("ketua")}
          />
        ),
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
        header: () => (
          <SortableHeader
            label="Status Pengisian"
            direction={currentSortBy === "filling_status" ? currentSort : false}
            onToggle={() => handleSortToggle("filling_status")}
          />
        ),
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
      {summary && (() => {
        const percentCompleted =
          summary.total > 0
            ? Math.round((summary.completed / summary.total) * 100)
            : 0
        const periodDisplay = summary.periodName || activePeriodName || null

        return (
          <div className="space-y-3">
            {/* 1. Header Ringkasan Kepatuhan & Progress Bar */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-gradient-to-r from-card via-card to-muted/20 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                    Tingkat Kepatuhan Pengisian Penilaian
                  </h3>
                  {periodDisplay && (
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-[11px] font-semibold bg-background/80 text-muted-foreground border-border"
                    >
                      Periode: {periodDisplay}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {summary.completed} dari {summary.total}
                  </span>
                  <span>departemen tuntas</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-1 text-[11px] font-bold border",
                      percentCompleted === 100
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {percentCompleted}%
                  </Badge>
                </div>
              </div>

              {/* Progress Bar Visual */}
              <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentCompleted}%` }}
                  role="progressbar"
                  aria-valuenow={percentCompleted}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* 2. Grid Responsif 4 Kartu Metrik (2x2 di Mobile, 4x1 di Desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* Kartu 1: Total Departemen */}
              <button
                type="button"
                onClick={() => handleFillingStatusFilterChange("all")}
                title="Klik untuk melihat semua departemen"
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  currentFillingStatusParam === "all"
                    ? "bg-card border-primary/50 ring-2 ring-primary/20"
                    : "bg-card border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                    Total Departemen
                  </span>
                  <div className="size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="size-3.5 sm:size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {summary.total}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                    14 Departemen Resmi
                  </p>
                </div>
              </button>

              {/* Kartu 2: Sudah Lengkap (100%) */}
              <button
                type="button"
                onClick={() =>
                  handleFillingStatusFilterChange(
                    currentFillingStatusParam === "completed" ? "all" : "completed"
                  )
                }
                title="Klik untuk memfilter departemen yang sudah lengkap"
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  currentFillingStatusParam === "completed"
                    ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/25"
                    : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                    Sudah Lengkap
                  </span>
                  <div className="size-7 sm:size-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="size-3.5 sm:size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
                    {summary.completed}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 truncate">
                    100% anggota dinilai
                  </p>
                </div>
              </button>

              {/* Kartu 3: Sedang Mengisi (Parsial) */}
              <button
                type="button"
                onClick={() =>
                  handleFillingStatusFilterChange(
                    currentFillingStatusParam === "partial" ? "all" : "partial"
                  )
                }
                title="Klik untuk memfilter departemen yang sedang mengisi"
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                  currentFillingStatusParam === "partial"
                    ? "bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/25"
                    : "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/10"
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-sky-800 dark:text-sky-300 truncate">
                    Sedang Mengisi
                  </span>
                  <div className="size-7 sm:size-8 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="size-3.5 sm:size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-sky-900 dark:text-sky-200">
                    {summary.partial}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-sky-700/80 dark:text-sky-400/80 mt-0.5 truncate">
                    Sebagian anggota dinilai
                  </p>
                </div>
              </button>

              {/* Kartu 4: Belum Mengisi (0%) */}
              <button
                type="button"
                onClick={() =>
                  handleFillingStatusFilterChange(
                    currentFillingStatusParam === "unfilled" ? "all" : "unfilled"
                  )
                }
                title="Klik untuk memfilter departemen yang belum mengisi"
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  currentFillingStatusParam === "unfilled"
                    ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/25"
                    : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10"
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-amber-800 dark:text-amber-300 truncate">
                    Belum Mengisi
                  </span>
                  <div className="size-7 sm:size-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <AlertCircle className="size-3.5 sm:size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
                    {summary.unfilled}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 truncate">
                    0% progres evaluasi
                  </p>
                </div>
              </button>
            </div>
          </div>
        )
      })()}

      {/* Search, Filter & Action Toolbar */}
      <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
          {/* Input Pencarian: Full width di mobile, teratur di desktop */}
          <div className="relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="search-departemen"
              aria-label="Cari nama atau kode departemen"
              placeholder="Cari nama atau kode departemen..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9.5 sm:h-9 pl-9 pr-9 text-xs sm:text-sm bg-background w-full"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                aria-label="Hapus kata kunci pencarian"
                title="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status: Grid 2 kolom seimbang di mobile, sejajar di sm+ */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <Select
              value={currentFillingStatusParam}
              onValueChange={handleFillingStatusFilterChange}
            >
              <SelectTrigger
                className="w-full sm:w-40 md:w-44 h-9.5 sm:h-9 text-xs sm:text-sm bg-background"
                aria-label="Filter status pengisian"
              >
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
              <SelectTrigger
                className="w-full sm:w-32 md:w-36 h-9.5 sm:h-9 text-xs sm:text-sm bg-background"
                aria-label="Filter status departemen"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif Saja</SelectItem>
                <SelectItem value="inactive">Nonaktif Saja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filter Button jika ada filter aktif */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 sm:h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground border-dashed w-full sm:w-auto justify-center shrink-0 cursor-pointer"
              title="Reset semua filter dan pencarian"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              <span>Reset Filter</span>
            </Button>
          )}
        </div>

        {/* Tombol Tambah Departemen: Full width di mobile, auto di sm+ */}
        {isSuperAdmin && (
          <Button
            onClick={() => {
              setNama("")
              setKode("")
              setIsActive(true)
              setAddOpen(true)
            }}
            className="w-full sm:w-auto h-9.5 sm:h-9 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs justify-center text-xs sm:text-sm transition-colors cursor-pointer"
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
                      Kepala Departemen
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
                      className="h-8 px-2.5 text-xs font-medium border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 shrink-0 rounded-md transition-colors cursor-pointer"
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-muted-foreground px-0.5 pt-1">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <p className="text-xs">
            {isAll
              ? `Menampilkan seluruh ${total} departemen`
              : `Menampilkan ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, total)} dari ${total} departemen`}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px]">Tampilkan:</span>
            <Select value={pageSizeValue} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-24 text-xs bg-background" aria-label="Pilih jumlah baris per halaman">
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
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex-1 sm:flex-initial h-8.5 px-3 text-xs justify-center cursor-pointer"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Sebelumnya
            </Button>
            <span className="px-2 font-medium text-xs text-center shrink-0">
              Halaman {page} dari {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex-1 sm:flex-initial h-8.5 px-3 text-xs justify-center cursor-pointer"
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
              Pilih atau Ganti Kepala Departemen
            </DialogTitle>
            <DialogDescription>
              Tentukan Kadep untuk <strong>{assignDept?.nama}</strong>. Mengganti Kadep
              tidak akan menghapus riwayat penilaian lama.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignKetua} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="select-ketua">Akun Kepala Departemen</Label>
              <Select
                value={selectedKetuaId}
                onValueChange={setSelectedKetuaId}
              >
                <SelectTrigger id="select-ketua" className="w-full">
                  <SelectValue placeholder="Pilih akun ketua..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    (Kosongkan / Tanpa Kadep)
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
                        {assignDept.ketua.nama} (Kedep Saat Ini)
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
