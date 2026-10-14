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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { UserRole } from "@/types/database"
import {
  getMembersServer,
  toggleMemberStatusAction,
  deleteMemberAction,
  type MemberListItem,
  type GetMembersResponse,
} from "@/lib/actions/member"
import { MemberFormDialog } from "./member-form-dialog"
import { MemberImportDialog } from "./member-import-dialog"

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

  // Dialog Penjelasan Tidak Boleh Hapus (Sudah ada penilaian)
  const [blockedDeleteMember, setBlockedDeleteMember] = React.useState<MemberListItem | null>(null)

  // Debounce input pencarian 350ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Muat data saat filter berubah
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
    })
  }, [debouncedSearch, status, departmentId, page, pageSize])

  React.useEffect(() => {
    loadData()
  }, [loadData])

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
    if (member.has_assessment) {
      setBlockedDeleteMember(member)
    } else {
      setDeleteTarget(member)
    }
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
                aria-label="Cari nama atau NIP anggota"
                placeholder="Cari berdasarkan nama atau NIP..."
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

      {/* Tampilan Desktop / Tablet: Tabel Data */}
      <div className="hidden sm:block rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead>NIP / ID</TableHead>
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
                  colSpan={showDeptFilter ? 8 : 7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Memuat data anggota...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showDeptFilter ? 8 : 7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data anggota yang sesuai kriteria pencarian.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((member, idx) => {
                const rowNumber = (data.page - 1) * data.pageSize + idx + 1
                return (
                  <TableRow key={member.id} className="hover:bg-muted/40">
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
                              className="text-muted-foreground hover:text-foreground"
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
        {isPending ? (
          <Card className="border p-6 text-center text-sm text-muted-foreground">
            Memuat data anggota...
          </Card>
        ) : data.data.length === 0 ? (
          <Card className="border p-6 text-center text-sm text-muted-foreground">
            Tidak ada data anggota ditemukan.
          </Card>
        ) : (
          data.data.map((member) => (
            <Card key={member.id} data-testid="member-card" className="border border-border/80 shadow-xs">
              <CardContent className="p-4 space-y-3">
                {/* Header Card: Nama & Badge Status */}
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
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[11px] font-medium border-emerald-200 dark:border-emerald-800"
                    >
                      <CheckCircle2 className="size-3 mr-1 shrink-0" />
                      <span>Aktif</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-medium border-slate-200 dark:border-slate-700"
                    >
                      <XCircle className="size-3 mr-1 shrink-0" />
                      <span>Nonaktif</span>
                    </Badge>
                  )}
                </div>

                {/* Detail Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
                  <div className="flex items-center gap-1.5">
                    <IdCard className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono">
                      {member.nip || <span className="italic text-muted-foreground/70">Tanpa NIP</span>}
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
                        className="h-8 px-2.5 text-xs gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(member)}
                        className="h-8 px-2 text-xs text-muted-foreground"
                      >
                        <Power className="h-3 w-3 mr-1" />
                        {member.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => initiateDelete(member)}
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Hapus
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
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
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data anggota{" "}
              <strong className="text-foreground">{deleteTarget?.nama}</strong>? Data akan
              dihapus dari daftar aktif (soft delete) dan tidak akan dapat dinilai pada periode
              berikutnya.
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

      {/* Dialog Penolakan Hapus (Karena Memiliki Penilaian) */}
      <Dialog
        open={Boolean(blockedDeleteMember)}
        onOpenChange={(open) => !open && setBlockedDeleteMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Anggota Tidak Dapat Dihapus
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground space-y-2">
              <p>
                Anggota <strong className="font-semibold">{blockedDeleteMember?.nama}</strong>{" "}
                sudah memiliki riwayat penilaian ({blockedDeleteMember?.assessment_count} lembar
                penilaian) di sistem.
              </p>
              <p className="text-sm text-muted-foreground">
                Sesuai aturan baku kepegawaian (PRD FR-3), anggota yang sudah dinilai{" "}
                <strong>hanya boleh dinonaktifkan</strong> agar integritas rekapitulasi nilai dan
                jejak audit tetap utuh.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setBlockedDeleteMember(null)}
            >
              Mengerti
            </Button>
            {blockedDeleteMember?.is_active && (
              <Button
                variant="secondary"
                className="bg-orange-500 text-white hover:bg-orange-600"
                onClick={async () => {
                  if (blockedDeleteMember) {
                    await handleToggleStatus(blockedDeleteMember)
                    setBlockedDeleteMember(null)
                  }
                }}
              >
                Nonaktifkan Anggota Ini
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
