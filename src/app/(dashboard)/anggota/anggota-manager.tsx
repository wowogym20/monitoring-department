"use client"

import * as React from "react"
import { useTransition } from "react"
import {
  Users,
  Plus,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  AlertTriangle,
  Building2,
  Phone,
  Briefcase,
  IdCard,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

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

import { UserRole } from "@/types/database"
import {
  getMembersServer,
  toggleMemberStatusAction,
  deleteMemberAction,
  getAllMemberIdsAction,
  bulkDeleteMembersAction,
  type MemberListItem,
  type GetMembersResponse,
} from "@/lib/actions/member"
import { exportSelectedMembersToExcel } from "@/lib/export/member-export"
import { MemberFormDialog } from "./member-form-dialog"
import { MemberImportDialog } from "./member-import-dialog"
import { MemberBulkEditDialog } from "./member-bulk-edit-dialog"

interface DepartmentOption {
  id: string
  nama: string
  kode: string
}

interface AnggotaManagerProps {
  userRole: UserRole
  userDepartmentId?: string | null
  userDepartmentName?: string | null
  departments: DepartmentOption[]
  initialData: GetMembersResponse
}

export function AnggotaManager({
  userRole,
  userDepartmentName,
  departments,
  initialData,
}: AnggotaManagerProps) {
  const [data, setData] = React.useState<GetMembersResponse>(initialData)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">("all")
  const [departmentId, setDepartmentId] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [formOpen, setFormOpen] = React.useState(false)
  const [memberToEdit, setMemberToEdit] = React.useState<MemberListItem | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)

  // Alert Dialog Hapus
  const [deleteTarget, setDeleteTarget] = React.useState<MemberListItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)


  // State Seleksi Baris & Aksi Massal
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isAllMatchingSelected, setIsAllMatchingSelected] = React.useState(false)
  const [isLoadingAllIds, setIsLoadingAllIds] = React.useState(false)

  // Modal Aksi Massal
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)
  const [isBulkExporting, setIsBulkExporting] = React.useState(false)

  // Debounce input pencarian 350ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Muat data saat filter berubah dan reset seleksi aktif
  const loadData = React.useCallback(() => {
    startTransition(async () => {
      const res = await getMembersServer({
        search: debouncedSearch,
        status,
        department_id: departmentId === "all" ? "" : departmentId,
        page,
        pageSize,
      })
      setData(res)
      setSelectedIds(new Set())
      setIsAllMatchingSelected(false)
    })
  }, [debouncedSearch, status, departmentId, page, pageSize])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Helper seleksi halaman saat ini
  const currentPageIds = React.useMemo(() => data.data.map((m) => m.id), [data.data])
  const isAllPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id))
  const isSomePageSelected =
    currentPageIds.some((id) => selectedIds.has(id)) && !isAllPageSelected

  function toggleSelectMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setIsAllMatchingSelected(false)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAllPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        currentPageIds.forEach((id) => next.add(id))
      } else {
        currentPageIds.forEach((id) => next.delete(id))
        setIsAllMatchingSelected(false)
      }
      return next
    })
  }

  async function handleSelectAllMatching() {
    setIsLoadingAllIds(true)
    try {
      const res = await getAllMemberIdsAction({
        search: debouncedSearch,
        status,
        department_id: departmentId === "all" ? "" : departmentId,
      })
      if (res.success && res.ids) {
        setSelectedIds(new Set(res.ids))
        setIsAllMatchingSelected(true)
        toast.success(`Seluruh ${res.ids.length} data anggota berhasil dipilih`)
      } else {
        toast.error(res.error || "Gagal memuat seluruh data anggota")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
      toast.error(msg)
    } finally {
      setIsLoadingAllIds(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setIsBulkDeleting(true)

    try {
      const res = await bulkDeleteMembersAction({
        memberIds: Array.from(selectedIds),
      })

      if (!res.success) {
        toast.error(res.error || "Gagal menghapus anggota terpilih")
        return
      }

      toast.success(res.message || "Anggota terpilih berhasil dihapus")
      setBulkDeleteOpen(false)
      setSelectedIds(new Set())
      setIsAllMatchingSelected(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem"
      toast.error(msg)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  async function handleBulkExport() {
    if (selectedIds.size === 0) return
    setIsBulkExporting(true)

    try {
      let membersToExport = data.data.filter((m) => selectedIds.has(m.id))

      // Jika ada anggota yang terpilih di luar halaman saat ini (misal via Pilih Semua)
      if (isAllMatchingSelected || membersToExport.length < selectedIds.size) {
        const res = await getMembersServer({
          search: debouncedSearch,
          status,
          department_id: departmentId === "all" ? "" : departmentId,
          page: 1,
          pageSize: 100, // Ambil dataset untuk diekspor
        })
        membersToExport = res.data.filter((m) => selectedIds.has(m.id))
      }

      if (membersToExport.length === 0) {
        toast.error("Tidak ada data anggota yang dapat diekspor")
        return
      }

      await exportSelectedMembersToExcel(
        membersToExport,
        `anggota-terpilih-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
      toast.success(`Berhasil mengekspor ${membersToExport.length} data anggota ke Excel`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor data anggota"
      toast.error(msg)
    } finally {
      setIsBulkExporting(false)
    }
  }

  // Aksi toggle status aktif
  async function handleToggleStatus(member: MemberListItem) {
    try {
      const nextStatus = !member.is_active
      const res = await toggleMemberStatusAction(member.id, nextStatus)
      if (!res.success) {
        toast.error(res.error || "Gagal mengubah status")
        return
      }
      toast.success(res.message)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(msg)
    }
  }

  // Klik tombol hapus
  function initiateDelete(member: MemberListItem) {
    setDeleteTarget(member)
  }

  // Konfirmasi eksekusi hapus
  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)

    try {
      const res = await deleteMemberAction(deleteTarget.id)
      if (!res.success) {
        toast.error(res.error || "Gagal menghapus anggota")
        return
      }
      toast.success(res.message || "Anggota berhasil dihapus")
      setDeleteTarget(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const canManage = userRole === "super_admin" || userRole === "user"
  const canImport = userRole === "super_admin" || userRole === "admin"
  const showDeptFilter = userRole === "super_admin" || userRole === "admin"

  return (
    <div className="space-y-6">
      {/* Header & Aksi Utama */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Manajemen Anggota
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "user" ? (
              <span>
                Daftar anggota departemen Anda:{" "}
                <strong className="text-foreground" data-testid="user-dept-indicator">
                  {userDepartmentName || data.currentDepartmentName || "Departemen Anda"}
                </strong>
              </span>
            ) : (
              "Kelola dan pantau seluruh data anggota departemen di lingkungan Pondok Modern Tazakka."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canImport && (
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              id="btn-open-import"
              className="gap-2 border-primary/30 text-primary hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Upload className="h-4 w-4" />
              Impor Massal
            </Button>
          )}

          {canManage && (
            <Button
              onClick={() => {
                setMemberToEdit(null)
                setFormOpen(true)
              }}
              id="btn-tambah-anggota"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Anggota
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Toolbar Pencarian */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Input Pencarian */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-anggota"
                aria-label="Cari nama atau NIG anggota"
                placeholder="Cari berdasarkan nama atau NIG..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Departemen (Khusus Admin & Super Admin) */}
            {showDeptFilter && (
              <div>
                <Select
                  value={departmentId}
                  onValueChange={(val) => {
                    setDepartmentId(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="filter-departemen" aria-label="Filter berdasarkan departemen" className="w-full">
                    <SelectValue placeholder="Pilih Departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Departemen</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.nama} ({dept.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filter Status Aktif */}
            <div className={showDeptFilter ? "" : "sm:col-span-2 lg:col-span-2"}>
              <Select
                value={status}
                onValueChange={(val: "all" | "active" | "inactive") => {
                  setStatus(val)
                  setPage(1)
                }}
              >
                <SelectTrigger id="filter-status" aria-label="Filter status keaktifan" className="w-full">
                  <SelectValue placeholder="Status Aktif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Hanya Aktif</SelectItem>
                  <SelectItem value="inactive">Hanya Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar Aksi Massal (Floating / Sticky) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        entityLabel="anggota"
        onClearSelection={() => {
          setSelectedIds(new Set())
          setIsAllMatchingSelected(false)
        }}
        onDelete={() => setBulkDeleteOpen(true)}
        onEdit={() => setBulkEditOpen(true)}
        onExport={handleBulkExport}
        canDelete={canManage}
        canEdit={canManage}
        canExport={true}
        isDeleting={isBulkDeleting}
        isExporting={isBulkExporting}
      />

      {/* Banner Opsi Pilih Seluruh Data Lintas Halaman */}
      {isAllPageSelected && data.total > data.data.length && (
        <div
          role="status"
          className="bg-primary/10 border border-primary/25 rounded-md px-4 py-2.5 text-xs text-center text-foreground flex flex-wrap items-center justify-center gap-2 animate-in fade-in duration-150"
        >
          {isAllMatchingSelected ? (
            <>
              <span>
                Seluruh <strong className="text-primary font-bold">{data.total}</strong> data anggota telah terpilih.
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold text-primary underline cursor-pointer"
                onClick={() => {
                  setIsAllMatchingSelected(false)
                  setSelectedIds(new Set(currentPageIds))
                }}
              >
                Batalkan seleksi seluruh halaman
              </Button>
            </>
          ) : (
            <>
              <span>
                Semua <strong className="font-semibold">{currentPageIds.length}</strong> anggota di halaman ini telah terpilih.
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold text-primary underline cursor-pointer"
                onClick={handleSelectAllMatching}
                disabled={isLoadingAllIds}
              >
                {isLoadingAllIds ? "Memuat seluruh data..." : `Pilih semua ${data.total} data anggota?`}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Tampilan Desktop / Tablet: Tabel Data */}
      <div className="hidden sm:block rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10 px-3 text-center">
                <Checkbox
                  checked={isAllPageSelected ? true : isSomePageSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => toggleSelectAllPage(Boolean(checked))}
                  aria-label="Pilih semua anggota di halaman ini"
                />
              </TableHead>
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead>NIG</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              {showDeptFilter && <TableHead>Departemen</TableHead>}
              <TableHead>Jabatan</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {canManage && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  colSpan={showDeptFilter ? 9 : 8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Memuat data anggota...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showDeptFilter ? 9 : 8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data anggota yang sesuai kriteria pencarian.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((member, idx) => {
                const rowNumber = (data.page - 1) * data.pageSize + idx + 1
                const isSelected = selectedIds.has(member.id)
                return (
                  <TableRow
                    key={member.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={`hover:bg-muted/40 ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <TableCell className="w-10 px-3 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectMember(member.id)}
                        aria-label={`Pilih baris anggota ${member.nama}`}
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {member.nip || <span className="text-muted-foreground italic">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{member.nama}</div>
                      {member.has_assessment && (
                        <div className="text-[11px] text-muted-foreground">
                          {member.assessment_count} riwayat penilaian
                        </div>
                      )}
                    </TableCell>
                    {showDeptFilter && (
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-xs">
                          {member.department_kode}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground text-sm">
                      {member.jabatan}
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.no_hp || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        >
                          <CheckCircle2 className="size-3 mr-1 shrink-0" />
                          <span>Aktif</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        >
                          <XCircle className="size-3 mr-1 shrink-0" />
                          <span>Nonaktif</span>
                        </Badge>
                      )}
                    </TableCell>

                    {canManage && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              id={`dropdown-aksi-${member.id}`}
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Menu Aksi</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi Anggota</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setMemberToEdit(member)
                                setFormOpen(true)
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              Ubah Data
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(member)}
                              className="cursor-pointer gap-2"
                            >
                              <Power className="h-4 w-4 text-muted-foreground" />
                              {member.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => initiateDelete(member)}
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus Anggota
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Mobile (< 640px / 360px): Kartu Anggota Responsif */}
      <div className="block sm:hidden space-y-3">
        {/* Kontrol Seleksi Cepat di Mobile */}
        {data.data.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <Checkbox
                checked={isAllPageSelected ? true : isSomePageSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => toggleSelectAllPage(Boolean(checked))}
                aria-label="Pilih semua anggota di halaman ini"
              />
              <span>Pilih semua di halaman ini</span>
            </label>
            {selectedIds.size > 0 && (
              <span className="font-semibold text-primary">{selectedIds.size} dipilih</span>
            )}
          </div>
        )}

        {isPending ? (
          <Card className="border p-6 text-center text-sm text-muted-foreground">
            Memuat data anggota...
          </Card>
        ) : data.data.length === 0 ? (
          <Card className="border p-6 text-center text-sm text-muted-foreground">
            Tidak ada data anggota ditemukan.
          </Card>
        ) : (
          data.data.map((member) => {
            const isSelected = selectedIds.has(member.id)
            return (
              <Card
                key={member.id}
                data-testid="member-card"
                className={`border shadow-xs transition-colors ${
                  isSelected ? "border-primary/50 bg-primary/5" : "border-border/80"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header Card: Checkbox + Nama & Badge Status */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectMember(member.id)}
                      aria-label={`Pilih kartu anggota ${member.nama}`}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base text-foreground leading-snug">
                            {member.nama}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            <span>{member.jabatan}</span>
                          </div>
                        </div>
                        {member.is_active ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[11px] font-medium border-emerald-200 dark:border-emerald-800 shrink-0"
                          >
                            <CheckCircle2 className="size-3 mr-1 shrink-0" />
                            <span>Aktif</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-medium border-slate-200 dark:border-slate-700 shrink-0"
                          >
                            <XCircle className="size-3 mr-1 shrink-0" />
                            <span>Nonaktif</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detail Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
                    <div className="flex items-center gap-1.5">
                      <IdCard className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono">
                        {member.nip || <span className="italic text-muted-foreground/70">Tanpa NIG</span>}
                      </span>
                    </div>

                    {showDeptFilter ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {member.department_kode}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{member.no_hp || "-"}</span>
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi Mobile */}
                  {canManage && (
                    <div className="pt-2 flex items-center justify-between gap-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMemberToEdit(member)
                            setFormOpen(true)
                          }}
                          className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                          Ubah
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(member)}
                          className="h-8 px-2 text-xs text-muted-foreground cursor-pointer"
                        >
                          <Power className="h-3 w-3 mr-1" />
                          {member.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => initiateDelete(member)}
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Kontrol Paginasi Sisi Server */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
        <div>
          Menampilkan{" "}
          <strong className="text-foreground">
            {data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1}
          </strong>{" "}
          sampai{" "}
          <strong className="text-foreground">
            {Math.min(data.page * data.pageSize, data.total)}
          </strong>{" "}
          dari <strong className="text-foreground">{data.total}</strong> anggota
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-24 text-xs" aria-label="Pilih jumlah baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / hal</SelectItem>
              <SelectItem value="10">10 / hal</SelectItem>
              <SelectItem value="25">25 / hal</SelectItem>
              <SelectItem value="50">50 / hal</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={data.page <= 1 || isPending}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Halaman Sebelumnya</span>
            </Button>

            <span className="px-2 font-medium text-foreground">
              {data.page} / {Math.max(1, data.totalPages)}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={data.page >= data.totalPages || isPending}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Halaman Berikutnya</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Form Tambah/Ubah */}
      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        memberToEdit={memberToEdit}
        userRole={userRole}
        userDepartmentName={userDepartmentName || data.currentDepartmentName}
        departments={departments}
        onSuccess={loadData}
      />

      {/* Modal Dialog Impor Massal */}
      <MemberImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={loadData}
      />

      {/* Alert Dialog Konfirmasi Hapus (Soft Delete) */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Anggota Departemen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Apakah Anda yakin ingin menghapus data anggota{" "}
                <strong className="text-foreground">{deleteTarget?.nama}</strong>? Data akan
                dihapus dari daftar aktif (soft delete) dan tidak akan dapat dinilai pada periode
                berikutnya.
              </span>
              {deleteTarget?.has_assessment && (
                <span className="block rounded-md bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-800 dark:text-amber-300 mt-2">
                  <strong>Perhatian:</strong> Anggota ini memiliki{" "}
                  <strong>{deleteTarget.assessment_count} riwayat penilaian</strong>. Seluruh lembar
                  penilaian, nilai aspek, dan komentar yang terintegrasi akan ikut dihapus secara
                  otomatis.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-delete"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Anggota"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog Ubah Massal Anggota */}
      <MemberBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedMemberIds={Array.from(selectedIds)}
        userRole={userRole}
        departments={departments}
        onSuccess={() => {
          setSelectedIds(new Set())
          setIsAllMatchingSelected(false)
          loadData()
        }}
      />

      {/* Alert Dialog Konfirmasi Hapus Massal */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus {selectedIds.size} Anggota Terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Apakah Anda yakin ingin menghapus{" "}
                <strong className="text-foreground">{selectedIds.size} anggota</strong> yang
                dipilih? Data akan dihapus dari daftar aktif (soft delete) dan tidak akan dapat
                dinilai pada periode berikutnya.
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Catatan: Jika ada anggota terpilih yang memiliki riwayat penilaian, seluruh lembar
                penilaian dan data terkait yang terintegrasi juga akan ikut dihapus secara otomatis.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-bulk-delete"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
            >
              {isBulkDeleting ? "Menghapus..." : `Ya, Hapus ${selectedIds.size} Anggota`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
