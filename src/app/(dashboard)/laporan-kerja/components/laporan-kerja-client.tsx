"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FileText,
  Search,
  X,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock3,
  XCircle,
  Calendar,
  Clock,
  User,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionBar } from "@/components/ui/bulk-action-bar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SortableHeader } from "@/components/ui/sortable-header"

import {
  deleteLaporanKerjaAction,
  updateStatusLaporanKerjaAction,
  bulkUpdateStatusLaporanKerjaAction,
  bulkDeleteLaporanKerjaAction,
  type LaporanKerjaItem,
  type LaporanKerjaApiResponse,
} from "@/lib/actions/laporan-kerja"
import { exportSelectedLaporanKerjaToExcel } from "@/lib/export/laporan-kerja-export"
import { LaporanDetailDialog } from "./laporan-detail-dialog"
import { LaporanFormDialog } from "./laporan-form-dialog"

type SortField = "tanggal" | "nama_guru" | "judul" | "status"
type SortOrder = "asc" | "desc"

interface LaporanKerjaClientProps {
  initialData: LaporanKerjaApiResponse
  userRole: string
  departmentName?: string | null
}

export interface UserLaporanGroup {
  userKey: string
  nip: string
  nama_pegawai: string
  items: LaporanKerjaItem[]
  stats: {
    total: number
    disetujui: number
    pending: number
    ditolak: number
  }
}

function formatDateIndoShort(dateStr: string) {
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d)
    }
  } catch {
    // fallback
  }
  return dateStr
}

export function LaporanKerjaClient({
  initialData,
  userRole,
  departmentName,
}: LaporanKerjaClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const canManage = ["super_admin", "admin", "user"].includes(userRole)

  // State untuk filter dan pencarian
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5) // Paginasi berbasis kelompok pegawai

  // State pengurutan kolom
  const [sortField, setSortField] = React.useState<SortField>("tanggal")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")

  // State collapse/expand per kelompok user (default: semua terbuka)
  const [collapsedUserKeys, setCollapsedUserKeys] = React.useState<Set<string>>(new Set())

  // State Seleksi Massal (Bulk Action)
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)
  const [isBulkExporting, setIsBulkExporting] = React.useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)

  // State dialog detail
  const [selectedItem, setSelectedItem] = React.useState<LaporanKerjaItem | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)

  // State dialog form (Tambah / Edit)
  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<LaporanKerjaItem | null>(null)

  // State dialog konfirmasi hapus tunggal
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<LaporanKerjaItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // State aksi status loading tunggal
  const [updatingStatusId, setUpdatingStatusId] = React.useState<number | null>(null)

  const items = React.useMemo(() => {
    return initialData.data || []
  }, [initialData.data])

  // Hitung Ringkasan KPI Global
  const stats = React.useMemo(() => {
    let total = items.length
    let disetujui = 0
    let pending = 0
    let ditolak = 0

    for (const item of items) {
      if (item.status === "Y") disetujui++
      else if (item.status === "N") ditolak++
      else pending++
    }

    return { total, disetujui, pending, ditolak }
  }, [items])

  // Filter data berdasarkan search query dan status
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim()
        const matchNama = (item.nama_pegawai || "").toLowerCase().includes(q)
        const matchNip = (item.nip || "").toLowerCase().includes(q)
        const matchJudul = (item.judul || "").toLowerCase().includes(q)
        const matchKeterangan = (item.keterangan || "").toLowerCase().includes(q)
        return matchNama || matchNip || matchJudul || matchKeterangan
      }

      return true
    })
  }, [items, statusFilter, searchQuery])

  // Handler pergantian pengurutan kolom
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder(field === "tanggal" ? "desc" : "asc")
    }
  }

  // Urutkan data berdasarkan kolom dan arah yang aktif
  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let cmp = 0
      if (sortField === "tanggal") {
        const dateTimeA = `${a.tanggal || ""} ${a.jam || ""}`
        const dateTimeB = `${b.tanggal || ""} ${b.jam || ""}`
        cmp = dateTimeA.localeCompare(dateTimeB)
      } else if (sortField === "nama_guru") {
        const nameA = a.nama_pegawai || ""
        const nameB = b.nama_pegawai || ""
        cmp = nameA.localeCompare(nameB, "id", { sensitivity: "base" })
        if (cmp === 0) {
          cmp = (a.nip || "").localeCompare(b.nip || "")
        }
      } else if (sortField === "judul") {
        const titleA = a.judul || ""
        const titleB = b.judul || ""
        cmp = titleA.localeCompare(titleB, "id", { sensitivity: "base" })
      } else if (sortField === "status") {
        const statusWeight: Record<string, number> = {
          Y: 1,
          PENDING: 2,
          N: 3,
        }
        const weightA = statusWeight[a.status] ?? 99
        const weightB = statusWeight[b.status] ?? 99
        cmp = weightA - weightB
      }

      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [filteredItems, sortField, sortOrder])

  // Pengelompokan data laporan kerja per user (pegawai/guru)
  const userGroups = React.useMemo(() => {
    const map = new Map<string, UserLaporanGroup>()

    for (const item of sortedItems) {
      const key = item.nip ? `nip:${item.nip}` : `name:${item.nama_pegawai}`
      let group = map.get(key)
      if (!group) {
        group = {
          userKey: key,
          nip: item.nip || "-",
          nama_pegawai: item.nama_pegawai || "Tanpa Nama Guru",
          items: [],
          stats: { total: 0, disetujui: 0, pending: 0, ditolak: 0 },
        }
        map.set(key, group)
      }
      group.items.push(item)
      group.stats.total++
      if (item.status === "Y") group.stats.disetujui++
      else if (item.status === "N") group.stats.ditolak++
      else group.stats.pending++
    }

    return Array.from(map.values())
  }, [sortedItems])

  // Pagination berbasis kelompok guru/pegawai
  const totalUserGroups = userGroups.length
  const totalPages = Math.max(1, Math.ceil(totalUserGroups / pageSize))

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const paginatedGroups = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return userGroups.slice(start, start + pageSize)
  }, [userGroups, currentPage, pageSize])

  // ID seluruh laporan pada halaman yang sedang aktif
  const currentPageItemIds = React.useMemo(() => {
    return paginatedGroups.flatMap((g) => g.items.map((i) => i.id))
  }, [paginatedGroups])

  // Seleksi seluruh halaman
  const isAllPageSelected =
    currentPageItemIds.length > 0 &&
    currentPageItemIds.every((id) => selectedIds.has(id))
  const isSomePageSelected =
    currentPageItemIds.some((id) => selectedIds.has(id)) && !isAllPageSelected

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        currentPageItemIds.forEach((id) => next.add(id))
      } else {
        currentPageItemIds.forEach((id) => next.delete(id))
      }
      return next
    })
  }

  // Seleksi seluruh laporan milik 1 user tertentu
  const toggleSelectUserGroup = (group: UserLaporanGroup) => {
    const groupIds = group.items.map((i) => i.id)
    const isAllGroupSelected = groupIds.every((id) => selectedIds.has(id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (isAllGroupSelected) {
        groupIds.forEach((id) => next.delete(id))
      } else {
        groupIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // Seleksi tunggal item laporan
  const toggleSelectItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle buka/tutup kontainer user
  const toggleCollapseUser = (userKey: string) => {
    setCollapsedUserKeys((prev) => {
      const next = new Set(prev)
      if (next.has(userKey)) next.delete(userKey)
      else next.add(userKey)
      return next
    })
  }

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleOpenDetail = (item: LaporanKerjaItem) => {
    setSelectedItem(item)
    setDetailDialogOpen(true)
  }

  const handleOpenAdd = () => {
    setItemToEdit(null)
    setFormDialogOpen(true)
  }

  const handleOpenEdit = (item: LaporanKerjaItem) => {
    setItemToEdit(item)
    setFormDialogOpen(true)
  }

  const handleOpenDelete = (item: LaporanKerjaItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const res = await deleteLaporanKerjaAction(itemToDelete.id)
      if (res.success) {
        toast.success(res.message || "Laporan kerja berhasil dihapus")
        setDeleteDialogOpen(false)
        setItemToDelete(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(itemToDelete.id)
          return next
        })
        handleRefresh()
      } else {
        toast.error(res.message || "Gagal menghapus laporan")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus laporan")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: "Y" | "N" | "PENDING") => {
    setUpdatingStatusId(id)
    try {
      const res = await updateStatusLaporanKerjaAction(id, status)
      if (res.success) {
        toast.success(res.message)
        handleRefresh()
      } else {
        toast.error(res.message || "Gagal memperbarui status")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Bulk Actions Handlers
  const handleBulkUpdateStatus = async (status: "Y" | "N" | "PENDING") => {
    if (selectedIds.size === 0) return
    setIsBulkUpdating(true)
    try {
      const res = await bulkUpdateStatusLaporanKerjaAction(Array.from(selectedIds), status)
      if (res.success) {
        toast.success(res.message)
        setSelectedIds(new Set())
        handleRefresh()
      } else {
        toast.error(res.message || "Gagal memperbarui status secara massal")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status secara massal")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await bulkDeleteLaporanKerjaAction(Array.from(selectedIds))
      if (res.success) {
        toast.success(res.message || "Laporan kerja terpilih berhasil dihapus")
        setBulkDeleteDialogOpen(false)
        setSelectedIds(new Set())
        handleRefresh()
      } else {
        toast.error(res.message || "Gagal menghapus laporan terpilih")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus laporan terpilih")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return
    setIsBulkExporting(true)
    try {
      const selectedItems = items.filter((i) => selectedIds.has(i.id))
      const dateStr = new Date().toISOString().slice(0, 10)
      await exportSelectedLaporanKerjaToExcel(
        selectedItems,
        `rekap-laporan-kerja-terpilih-${dateStr}.xlsx`
      )
      toast.success(`${selectedItems.length} laporan kerja berhasil diekspor ke Excel`)
    } catch {
      toast.error("Gagal mengekspor data laporan kerja ke Excel")
    } finally {
      setIsBulkExporting(false)
    }
  }

  const handleResetFilter = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortField("tanggal")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="size-6 sm:size-7 text-primary shrink-0" />
              <span>Laporan Kerja Anggota</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pusat pemantauan dan pengelolaan laporan kegiatan guru terhubung langsung dengan sistem Absensi Tazakka v2.0.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Tambah Laporan</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPending ? "animate-spin text-primary" : ""}`}
            />
            <span>Segarkan</span>
          </Button>

          {departmentName && (
            <Badge variant="secondary" className="text-xs font-normal">
              {departmentName}
            </Badge>
          )}
        </div>
      </div>

      {/* Alert Banner jika koneksi ke server API Tazakka mengalami gangguan / timeout */}
      {initialData.status === "error" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs sm:text-sm">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <AlertCircle className="size-5 shrink-0 mt-0.5 sm:mt-0 text-destructive" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-semibold text-destructive">
                Gagal Menghubungkan ke Server Tazakka
              </p>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {initialData.message || "Koneksi ke server API Tazakka mengalami batas waktu (timeout)."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-8 text-xs shrink-0 cursor-pointer border-destructive/40 text-destructive hover:bg-destructive/10 self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Coba Lagi</span>
          </Button>
        </div>
      )}

      {/* Ringkasan KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Total Laporan</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="size-9 sm:size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="size-4 sm:size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Disetujui</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.disetujui}
              </p>
            </div>
            <div className="size-9 sm:size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4 sm:size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
            </div>
            <div className="size-9 sm:size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock3 className="size-4 sm:size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Ditolak</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.ditolak}
              </p>
            </div>
            <div className="size-9 sm:size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="size-4 sm:size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari nama guru, NIG, atau judul laporan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Y">Disetujui</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="N">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filter jika aktif */}
          {(searchQuery || statusFilter !== "all" || sortField !== "tanggal" || sortOrder !== "desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <Filter className="size-3.5 mr-1" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar Aksi Massal (Bulk Action Bar) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        entityLabel="laporan"
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={() => setBulkDeleteDialogOpen(true)}
        onExport={handleBulkExport}
        canDelete={canManage}
        canExport={true}
        isDeleting={isBulkDeleting}
        isUpdating={isBulkUpdating}
        isExporting={isBulkExporting}
        customActions={
          canManage ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus("Y")}
                disabled={isBulkUpdating || isBulkDeleting || isBulkExporting}
                className="h-8 px-2.5 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                aria-label="Setujui seluruh laporan terpilih"
              >
                <ThumbsUp className="size-3.5" />
                <span className="hidden xs:inline">Setujui</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus("N")}
                disabled={isBulkUpdating || isBulkDeleting || isBulkExporting}
                className="h-8 px-2.5 text-xs gap-1.5 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                aria-label="Tolak seluruh laporan terpilih"
              >
                <ThumbsDown className="size-3.5" />
                <span className="hidden xs:inline">Tolak</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus("PENDING")}
                disabled={isBulkUpdating || isBulkDeleting || isBulkExporting}
                className="h-8 px-2.5 text-xs gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                aria-label="Ubah status seluruh laporan terpilih ke pending"
              >
                <Clock3 className="size-3.5" />
                <span className="hidden xs:inline">Pending</span>
              </Button>
            </div>
          ) : null
        }
      />

      {/* Kontrol Seleksi Cepat di Header Data */}
      {paginatedGroups.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-border/50">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground py-0.5">
            <Checkbox
              checked={isAllPageSelected ? true : isSomePageSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => toggleSelectAllPage(Boolean(checked))}
              aria-label="Pilih semua laporan pada halaman ini"
            />
            <span>Pilih semua laporan pada halaman ini</span>
          </label>
          <span className="font-mono text-[11px]">
            {selectedIds.size > 0 ? (
              <strong className="text-primary font-bold">{selectedIds.size} dipilih</strong>
            ) : (
              `${sortedItems.length} total laporan`
            )}
          </span>
        </div>
      )}

      {/* Konten Data: Pemisahan Kotak / Kontainer per User (Pegawai/Guru) */}
      {paginatedGroups.length === 0 ? (
        <Card className="border-border/80 shadow-xs p-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <FileText className="size-9 stroke-1 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              {initialData.status === "error"
                ? "Tidak dapat memuat data laporan"
                : "Tidak ada laporan kerja yang ditemukan"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {initialData.status === "error"
                ? "Server API Tazakka saat ini tidak dapat dijangkau. Silakan klik tombol 'Coba Lagi' di atas atau coba beberapa saat lagi."
                : searchQuery || statusFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau ganti filter status."
                  : "Belum ada catatan laporan kerja yang tersedia."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedGroups.map((group) => {
            const isCollapsed = collapsedUserKeys.has(group.userKey)
            const groupIds = group.items.map((i) => i.id)
            const isAllGroupSelected =
              groupIds.length > 0 && groupIds.every((id) => selectedIds.has(id))
            const isSomeGroupSelected =
              groupIds.some((id) => selectedIds.has(id)) && !isAllGroupSelected

            return (
              <Card
                key={group.userKey}
                className="border-border/80 shadow-xs overflow-hidden max-w-full bg-card"
              >
                {/* Header Kontainer Pegawai */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-3 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={
                        isAllGroupSelected
                          ? true
                          : isSomeGroupSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={() => toggleSelectUserGroup(group)}
                      aria-label={`Pilih semua laporan milik ${group.nama_pegawai}`}
                      className="shrink-0"
                    />

                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      <User className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          {group.nama_pegawai}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground bg-muted/50 shrink-0"
                        >
                          NIG: {group.nip}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan & Toggle Collapse */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium h-5 px-1.5"
                      >
                        {group.stats.total} Laporan
                      </Badge>
                      {group.stats.disetujui > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-[10px] h-5 px-1.5"
                        >
                          {group.stats.disetujui} Disetujui
                        </Badge>
                      )}
                      {group.stats.pending > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-[10px] h-5 px-1.5"
                        >
                          {group.stats.pending} Pending
                        </Badge>
                      )}
                      {group.stats.ditolak > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 text-[10px] h-5 px-1.5"
                        >
                          {group.stats.ditolak} Ditolak
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleCollapseUser(group.userKey)}
                      className="size-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title={isCollapsed ? "Buka kontainer laporan" : "Tutup kontainer laporan"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronUp className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Isi Kontainer (Laporan Pegawai Terkait) */}
                {!isCollapsed && (
                  <div>
                    {/* Tampilan Desktop Table di dalam Kontainer Pegawai */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow>
                            <TableHead className="w-10 text-center">
                              <span className="sr-only">Pilih</span>
                            </TableHead>
                            <TableHead className="w-12 text-center text-xs font-semibold">
                              No
                            </TableHead>
                            <TableHead className="w-40 text-xs font-semibold">
                              <SortableHeader
                                label="Tanggal & Waktu"
                                type="date"
                                direction={sortField === "tanggal" ? sortOrder : false}
                                onToggle={() => handleSort("tanggal")}
                              />
                            </TableHead>
                            <TableHead className="text-xs font-semibold">
                              <SortableHeader
                                label="Judul & Uraian"
                                type="alpha"
                                direction={sortField === "judul" ? sortOrder : false}
                                onToggle={() => handleSort("judul")}
                              />
                            </TableHead>
                            <TableHead className="w-16 text-center text-xs font-semibold">
                              Foto
                            </TableHead>
                            <TableHead className="w-28 text-center text-xs font-semibold">
                              <div className="flex justify-center">
                                <SortableHeader
                                  label="Status"
                                  type="general"
                                  direction={sortField === "status" ? sortOrder : false}
                                  onToggle={() => handleSort("status")}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="w-24 text-center text-xs font-semibold">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((item, index) => {
                            const isSelected = selectedIds.has(item.id)
                            const isStatusUpdating = updatingStatusId === item.id

                            return (
                              <TableRow
                                key={item.id}
                                className={`hover:bg-muted/30 transition-colors ${
                                  isSelected ? "bg-primary/5" : ""
                                }`}
                              >
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelectItem(item.id)}
                                    aria-label={`Pilih laporan ${item.judul}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                      <Calendar className="size-3 text-primary shrink-0" />
                                      <span>{formatDateIndoShort(item.tanggal)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Clock className="size-2.5 shrink-0" />
                                      <span>{item.jam || "-"} WIB</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                                      {item.judul || "Tanpa Judul"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                                      {item.keterangan || "-"}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.foto_url ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDetail(item)}
                                      className="inline-block relative size-9 rounded-md overflow-hidden border border-border hover:opacity-80 transition cursor-pointer"
                                      title="Klik untuk melihat foto"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={item.foto_url}
                                        alt={item.judul}
                                        loading="lazy"
                                        className="size-full object-cover"
                                      />
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground/60 italic">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isStatusUpdating ? (
                                    <Loader2 className="size-4 animate-spin mx-auto text-primary" />
                                  ) : (
                                    <>
                                      {item.status === "Y" && (
                                        <Badge
                                          variant="outline"
                                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[11px] font-medium"
                                        >
                                          Disetujui
                                        </Badge>
                                      )}
                                      {item.status === "N" && (
                                        <Badge
                                          variant="outline"
                                          className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-[11px] font-medium"
                                        >
                                          Ditolak
                                        </Badge>
                                      )}
                                      {item.status !== "Y" && item.status !== "N" && (
                                        <Badge
                                          variant="outline"
                                          className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[11px] font-medium"
                                        >
                                          Pending
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleOpenDetail(item)}
                                      className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                      title="Lihat Detail"
                                    >
                                      <Eye className="size-4" />
                                    </Button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                          <MoreVertical className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuLabel className="text-xs">
                                          Opsi Laporan
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => handleOpenDetail(item)}
                                          className="text-xs cursor-pointer"
                                        >
                                          <Eye className="size-3.5 mr-2" /> Lihat Detail
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleOpenEdit(item)}
                                          className="text-xs cursor-pointer"
                                        >
                                          <Pencil className="size-3.5 mr-2" /> Ubah Laporan
                                        </DropdownMenuItem>

                                        {canManage && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                              Persetujuan
                                            </DropdownMenuLabel>
                                            {item.status !== "Y" && (
                                              <DropdownMenuItem
                                                onClick={() => handleUpdateStatus(item.id, "Y")}
                                                className="text-xs cursor-pointer text-emerald-600 focus:text-emerald-700"
                                              >
                                                <ThumbsUp className="size-3.5 mr-2" /> Setujui
                                              </DropdownMenuItem>
                                            )}
                                            {item.status !== "N" && (
                                              <DropdownMenuItem
                                                onClick={() => handleUpdateStatus(item.id, "N")}
                                                className="text-xs cursor-pointer text-rose-600 focus:text-rose-700"
                                              >
                                                <ThumbsDown className="size-3.5 mr-2" /> Tolak
                                              </DropdownMenuItem>
                                            )}
                                            {item.status !== "PENDING" && (
                                              <DropdownMenuItem
                                                onClick={() => handleUpdateStatus(item.id, "PENDING")}
                                                className="text-xs cursor-pointer text-amber-600 focus:text-amber-700"
                                              >
                                                <Clock3 className="size-3.5 mr-2" /> Ubah ke Pending
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => handleOpenDelete(item)}
                                              className="text-xs cursor-pointer text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="size-3.5 mr-2" /> Hapus
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tampilan Mobile Card Layout di dalam Kontainer Pegawai */}
                    <div className="block md:hidden divide-y divide-border/60">
                      {group.items.map((item) => {
                        const isSelected = selectedIds.has(item.id)
                        const isStatusUpdating = updatingStatusId === item.id

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 space-y-2.5 transition-colors ${
                              isSelected ? "bg-primary/5" : ""
                            }`}
                          >
                            {/* Baris Atas: Checkbox, Tanggal/Jam, dan Status Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelectItem(item.id)}
                                  aria-label={`Pilih laporan ${item.judul}`}
                                  className="shrink-0"
                                />
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 truncate">
                                  <Calendar className="size-3 text-primary shrink-0" />
                                  {formatDateIndoShort(item.tanggal)} • {item.jam} WIB
                                </span>
                              </div>

                              <div className="shrink-0">
                                {isStatusUpdating ? (
                                  <Loader2 className="size-3.5 animate-spin text-primary" />
                                ) : (
                                  <>
                                    {item.status === "Y" && (
                                      <Badge
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-[10px] font-medium"
                                      >
                                        Disetujui
                                      </Badge>
                                    )}
                                    {item.status === "N" && (
                                      <Badge
                                        variant="outline"
                                        className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 text-[10px] font-medium"
                                      >
                                        Ditolak
                                      </Badge>
                                    )}
                                    {item.status !== "Y" && item.status !== "N" && (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-[10px] font-medium"
                                      >
                                        Pending
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Judul & Uraian (Anti-Overflow with min-w-0 and break-words) */}
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground break-words leading-snug">
                                {item.judul || "Tanpa Judul"}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 break-words">
                                {item.keterangan || "-"}
                              </p>
                            </div>

                            {/* Baris Bawah: Status Foto, Tombol Detail, dan Icon Titik Tiga Dropdown Menu */}
                            <div className="flex items-center justify-between pt-1 gap-2">
                              <div className="min-w-0">
                                {item.foto_url ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetail(item)}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer truncate"
                                  >
                                    <ImageIcon className="size-3 shrink-0" />
                                    <span>Ada Lampiran Foto</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground/60 italic">
                                    Tanpa Foto
                                  </span>
                                )}
                              </div>

                              {/* Aksi Mobile: Tombol Cepat Detail + Icon Titik Tiga Aksi Lengkap */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDetail(item)}
                                  className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                                  title="Lihat Detail Laporan"
                                >
                                  <Eye className="size-3" />
                                  <span>Detail</span>
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                      aria-label="Menu aksi laporan"
                                    >
                                      <MoreVertical className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">
                                      Aksi Laporan
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenDetail(item)}
                                      className="text-xs cursor-pointer"
                                    >
                                      <Eye className="size-3.5 mr-2 text-muted-foreground" />
                                      Lihat Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenEdit(item)}
                                      className="text-xs cursor-pointer"
                                    >
                                      <Pencil className="size-3.5 mr-2 text-muted-foreground" />
                                      Ubah Laporan
                                    </DropdownMenuItem>

                                    {canManage && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                          Persetujuan
                                        </DropdownMenuLabel>
                                        {item.status !== "Y" && (
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(item.id, "Y")}
                                            className="text-xs cursor-pointer text-emerald-600 focus:text-emerald-700"
                                          >
                                            <ThumbsUp className="size-3.5 mr-2" />
                                            Setujui
                                          </DropdownMenuItem>
                                        )}
                                        {item.status !== "N" && (
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(item.id, "N")}
                                            className="text-xs cursor-pointer text-rose-600 focus:text-rose-700"
                                          >
                                            <ThumbsDown className="size-3.5 mr-2" />
                                            Tolak
                                          </DropdownMenuItem>
                                        )}
                                        {item.status !== "PENDING" && (
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(item.id, "PENDING")}
                                            className="text-xs cursor-pointer text-amber-600 focus:text-amber-700"
                                          >
                                            <Clock3 className="size-3.5 mr-2" />
                                            Ubah ke Pending
                                          </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleOpenDelete(item)}
                                          className="text-xs cursor-pointer text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="size-3.5 mr-2" />
                                          Hapus Laporan
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Footer Paginasi (Responsif & Anti-Overflow) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl border border-border/70 bg-card shadow-xs text-xs">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-muted-foreground">
          <span>Guru per halaman:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[11px] sm:text-xs">
            Menampilkan {totalUserGroups > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
            {Math.min(currentPage * pageSize, totalUserGroups)} dari {totalUserGroups} guru ({sortedItems.length} laporan)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground text-[11px] sm:text-xs">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="size-7 cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="size-7 cursor-pointer"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Modal Dialog Detail Laporan */}
      <LaporanDetailDialog
        item={selectedItem}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Modal Dialog Tambah / Edit Laporan */}
      <LaporanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        item={itemToEdit}
        onSuccess={handleRefresh}
      />

      {/* Alert Dialog Konfirmasi Hapus Tunggal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Laporan Kerja?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus laporan kerja &quot;
              <span className="font-semibold text-foreground">
                {itemToDelete?.judul}
              </span>
              &quot; oleh{" "}
              <span className="font-semibold text-foreground">
                {itemToDelete?.nama_pegawai}
              </span>
              ? Berkas foto dan data yang telah dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-9 cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 cursor-pointer"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Hapus Laporan</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Konfirmasi Hapus Massal */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Laporan Kerja Terpilih?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tindakan ini akan menghapus permanen{" "}
              <strong className="text-destructive font-semibold">{selectedIds.size}</strong>{" "}
              laporan kerja terpilih beserta berkas lampiran foto yang terkait. Data yang telah dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting} className="text-xs h-9 cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="text-xs h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 cursor-pointer"
            >
              {isBulkDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Hapus {selectedIds.size} Laporan</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
