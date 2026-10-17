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
  Filter,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  type LaporanKerjaItem,
  type LaporanKerjaApiResponse,
} from "@/lib/actions/laporan-kerja"
import { LaporanDetailDialog } from "./laporan-detail-dialog"
import { LaporanFormDialog } from "./laporan-form-dialog"

type SortField = "tanggal" | "nama_guru" | "judul" | "status"
type SortOrder = "asc" | "desc"

interface LaporanKerjaClientProps {
  initialData: LaporanKerjaApiResponse
  userRole: string
  departmentName?: string | null
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
  const isSuperAdminOrAdmin = userRole === "super_admin" || userRole === "admin"

  // State untuk filter dan pencarian
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // State untuk pengurutan kolom tabel (default: tanggal terbaru/descending)
  const [sortField, setSortField] = React.useState<SortField>("tanggal")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")

  // State dialog detail
  const [selectedItem, setSelectedItem] = React.useState<LaporanKerjaItem | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)

  // State dialog form (Tambah / Edit)
  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<LaporanKerjaItem | null>(null)

  // State dialog konfirmasi hapus
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<LaporanKerjaItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // State aksi status loading
  const [updatingStatusId, setUpdatingStatusId] = React.useState<number | null>(null)

  const items = React.useMemo(() => {
    return initialData.data || []
  }, [initialData.data])

  // Hitung Ringkasan KPI
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

  // Pagination kalkulasi
  const totalFiltered = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

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
        toast.error(res.message)
        setDeleteDialogOpen(false)
        setItemToDelete(null)
        handleRefresh()
      } else {
        toast.error(res.message)
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
        if (status === "N") {
          toast.error(res.message)
        } else if (status === "PENDING") {
          toast.warning(res.message)
        } else {
          toast.success(res.message)
        }
        handleRefresh()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status")
    } finally {
      setUpdatingStatusId(null)
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
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <FileText className="size-7 text-primary shrink-0" />
              Laporan Kerja Anggota
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pusat pemantauan dan pengelolaan laporan kegiatan pegawai terhubung langsung dengan sistem absensi Tazakka.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Plus className="size-4" />
            <span>Tambah Laporan</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-9 gap-1.5 text-xs font-medium"
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

      {/* Ringkasan KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Laporan</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Disetujui</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.disetujui}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock3 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Ditolak</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.ditolak}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari nama guru, NIG, atau judul laporan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              <SelectTrigger className="h-9 text-sm">
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
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <Filter className="size-3.5 mr-1" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Konten Data: Tabel Desktop & Kartu Mobile */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        {/* Tampilan Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
                <TableHead className="w-44 text-xs font-semibold">
                  <SortableHeader
                    label="Tanggal & Waktu"
                    type="date"
                    direction={sortField === "tanggal" ? sortOrder : false}
                    onToggle={() => handleSort("tanggal")}
                  />
                </TableHead>
                <TableHead className="w-56 text-xs font-semibold">
                  <SortableHeader
                    label="Nama Guru"
                    type="alpha"
                    direction={sortField === "nama_guru" ? sortOrder : false}
                    onToggle={() => handleSort("nama_guru")}
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
                <TableHead className="w-20 text-center text-xs font-semibold">Foto</TableHead>
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
                <TableHead className="w-32 text-center text-xs font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <FileText className="size-8 stroke-1 text-muted-foreground/60" />
                      <p className="text-sm font-medium text-foreground">
                        Tidak ada laporan kerja yang ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Coba ubah kata kunci pencarian atau sesuaikan filter status."
                          : "Belum ada data laporan kerja yang dikirimkan."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1
                  const isStatusUpdating = updatingStatusId === item.id

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        {rowNumber}
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
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-foreground line-clamp-1">
                            {item.nama_pegawai || "-"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground bg-muted/30"
                            >
                              NIG: {item.nip || "-"}
                            </Badge>
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
                            className="inline-block relative size-10 rounded-md overflow-hidden border border-border hover:opacity-80 transition cursor-pointer"
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
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Lihat Detail"
                          >
                            <Eye className="size-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 text-muted-foreground hover:text-foreground"
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

                              {isSuperAdminOrAdmin && (
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
                                </>
                              )}

                              {isSuperAdminOrAdmin && (
                                <>
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
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Tampilan Mobile Card Layout */}
        <div className="block md:hidden divide-y divide-border/60">
          {paginatedItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FileText className="size-8 mx-auto text-muted-foreground/60 stroke-1 mb-2" />
              <p className="text-sm font-medium text-foreground">
                Tidak ada laporan kerja ditemukan
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Silakan sesuaikan filter atau pencarian Anda.
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3 text-primary" />
                      {formatDateIndoShort(item.tanggal)} • {item.jam} WIB
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.judul || "Tanpa Judul"}
                    </h3>
                  </div>
                  <div>
                    {item.status === "Y" && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-[10px]"
                      >
                        Disetujui
                      </Badge>
                    )}
                    {item.status === "N" && (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 text-[10px]"
                      >
                        Ditolak
                      </Badge>
                    )}
                    {item.status !== "Y" && item.status !== "N" && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-[10px]"
                      >
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="size-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{item.nama_pegawai || "-"}</span>
                  <span className="font-mono text-[10px]">({item.nip || "-"})</span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.keterangan || "-"}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {item.foto_url ? (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="size-3 text-primary" />
                      Ada Lampiran Foto
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60">
                      Tanpa Foto
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(item)}
                      className="h-7 text-xs gap-1"
                    >
                      <Eye className="size-3" />
                      Detail
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-7 text-xs gap-1"
                    >
                      <Pencil className="size-3" />
                      Ubah
                    </Button>

                    {isSuperAdminOrAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDelete(item)}
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Paginasi */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Baris per halaman:</span>
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
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-2">
              Menampilkan {totalFiltered > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(currentPage * pageSize, totalFiltered)} dari {totalFiltered} laporan
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground mr-1">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="size-7"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="size-7"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

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

      {/* Alert Dialog Konfirmasi Hapus */}
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
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-9">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Hapus Laporan</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
