"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Card } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
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
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { formatDateJakarta } from "@/lib/date"
import {
  createPeriodAction,
  updatePeriodAction,
  togglePeriodStatusAction,
  deletePeriodAction,
} from "@/lib/actions/periode"
import { AssessmentPeriod, UserRole } from "@/types/database"

interface PeriodeManagerProps {
  initialPeriods: AssessmentPeriod[]
  currentUserRole: UserRole
}

export function PeriodeManager({
  initialPeriods,
  currentUserRole,
}: PeriodeManagerProps) {
  const router = useRouter()
  const isSuperAdmin = currentUserRole === "super_admin"

  // Dialog states
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editPeriod, setEditPeriod] = React.useState<AssessmentPeriod | null>(null)
  const [deletePeriod, setDeletePeriod] = React.useState<AssessmentPeriod | null>(null)
  const [statusDialog, setStatusDialog] = React.useState<{
    period: AssessmentPeriod
    targetStatus: "open" | "closed"
  } | null>(null)

  // Form states
  const [nama, setNama] = React.useState("")
  const [tanggalMulai, setTanggalMulai] = React.useState("")
  const [tanggalAkhir, setTanggalAkhir] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<
    "nama" | "tanggal_mulai" | "tanggal_akhir" | "status" | "created_at"
  >("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  const handleSort = (
    col: "nama" | "tanggal_mulai" | "tanggal_akhir" | "status" | "created_at"
  ) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

  // Urutkan periode sesuai kolom yang dipilih atau default urutan dibuat
  const sortedPeriods = React.useMemo(() => {
    return [...initialPeriods].sort((a, b) => {
      let cmp = 0
      if (sortBy === "nama") {
        cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
      } else if (sortBy === "tanggal_mulai") {
        cmp = a.tanggal_mulai.localeCompare(b.tanggal_mulai)
      } else if (sortBy === "tanggal_akhir") {
        cmp = a.tanggal_akhir.localeCompare(b.tanggal_akhir)
      } else if (sortBy === "status") {
        cmp = a.status.localeCompare(b.status)
      } else if (sortBy === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [initialPeriods, sortBy, sortOrder])

  // Action: Buat Periode Baru
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tanggalMulai) {
      toast.error("Tanggal mulai wajib diisi")
      return
    }
    if (!tanggalAkhir) {
      toast.error("Tanggal akhir wajib diisi")
      return
    }
    if (tanggalAkhir < tanggalMulai) {
      toast.error("Tanggal akhir tidak boleh mendahului tanggal mulai")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPeriodAction({
        nama,
        tanggal_mulai: tanggalMulai,
        tanggal_akhir: tanggalAkhir,
        status: "open",
      })

      if (res.success) {
        toast.success(res.message)
        setCreateOpen(false)
        setNama("")
        setTanggalMulai("")
        setTanggalAkhir("")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal membuat periode penilaian")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Ubah Periode
  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPeriod) return
    if (!tanggalMulai) {
      toast.error("Tanggal mulai wajib diisi")
      return
    }
    if (!tanggalAkhir) {
      toast.error("Tanggal akhir wajib diisi")
      return
    }
    if (tanggalAkhir < tanggalMulai) {
      toast.error("Tanggal akhir tidak boleh mendahului tanggal mulai")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updatePeriodAction({
        id: editPeriod.id,
        nama,
        tanggal_mulai: tanggalMulai,
        tanggal_akhir: tanggalAkhir,
      })

      if (res.success) {
        toast.success(res.message)
        setEditPeriod(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal memperbarui periode penilaian")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Buka / Tutup Periode
  const handleConfirmToggleStatus = async () => {
    if (!statusDialog) return
    setIsSubmitting(true)
    try {
      const res = await togglePeriodStatusAction({
        id: statusDialog.period.id,
        status: statusDialog.targetStatus,
      })

      if (res.success) {
        toast.success(res.message)
        setStatusDialog(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status periode")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Hapus Periode
  const handleDeletePeriod = async () => {
    if (!deletePeriod) return
    setIsSubmitting(true)
    try {
      const res = await deletePeriodAction(deletePeriod.id)
      if (res.success) {
        toast.success(res.message)
        setDeletePeriod(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menghapus periode")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (status: "open" | "closed") => {
    if (status === "open") {
      return (
        <Badge className="bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 flex items-center gap-1.5 w-fit">
          <span className="size-1.5 rounded-full bg-white animate-pulse" />
          Terbuka (Open)
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-muted text-muted-foreground flex items-center gap-1.5 w-fit"
      >
        <Lock className="size-3" />
        Ditutup (Closed)
      </Badge>
    )
  }

  const renderActionMenu = (period: AssessmentPeriod) => {
    const isOpen = period.status === "open"
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 p-0"
            aria-label="Aksi Periode"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setEditPeriod(period)
              setNama(period.nama)
              setTanggalMulai(period.tanggal_mulai)
              setTanggalAkhir(period.tanggal_akhir)
            }}
          >
            <Edit className="size-4 mr-2" />
            Ubah Rincian
          </DropdownMenuItem>

          {isOpen ? (
            <DropdownMenuItem
              onClick={() =>
                setStatusDialog({
                  period,
                  targetStatus: "closed",
                })
              }
            >
              <Lock className="size-4 mr-2 text-amber-600" />
              Tutup Periode
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={!isSuperAdmin}
              onClick={() => {
                if (!isSuperAdmin) {
                  toast.error(
                    "Hanya Super-Admin yang dapat membuka kembali periode yang sudah ditutup."
                  )
                  return
                }
                setStatusDialog({
                  period,
                  targetStatus: "open",
                })
              }}
            >
              <Unlock className="size-4 mr-2 text-emerald-600" />
              Buka Kembali {!isSuperAdmin && "(Khusus Super-Admin)"}
            </DropdownMenuItem>
          )}

          {isSuperAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setDeletePeriod(period)}
              >
                <Trash2 className="size-4 mr-2" />
                Hapus Periode
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total {initialPeriods.length} periode evaluasi tercatat di sistem.
        </p>

        <Button
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10)
            setNama("")
            setTanggalMulai(today)
            setTanggalAkhir(today)
            setCreateOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
        >
          <Plus className="size-4 mr-1.5" />
          Buka Periode Baru
        </Button>
      </div>

      {/* Tampilan Desktop (>= md): Tabel */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">No.</TableHead>
              <TableHead>
                <SortableHeader
                  label="Nama Periode"
                  direction={sortBy === "nama" ? sortOrder : false}
                  onToggle={() => handleSort("nama")}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Tanggal Mulai"
                  type="date"
                  direction={sortBy === "tanggal_mulai" ? sortOrder : false}
                  onToggle={() => handleSort("tanggal_mulai")}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Tanggal Akhir"
                  type="date"
                  direction={sortBy === "tanggal_akhir" ? sortOrder : false}
                  onToggle={() => handleSort("tanggal_akhir")}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Status Periode"
                  type="general"
                  direction={sortBy === "status" ? sortOrder : false}
                  onToggle={() => handleSort("status")}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Dibuat"
                  type="date"
                  direction={sortBy === "created_at" ? sortOrder : false}
                  onToggle={() => handleSort("created_at")}
                />
              </TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPeriods.length > 0 ? (
              sortedPeriods.map((period, idx) => (
                <TableRow key={period.id}>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {period.nama}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateJakarta(period.tanggal_mulai)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateJakarta(period.tanggal_akhir)}
                  </TableCell>
                  <TableCell>{renderStatusBadge(period.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateJakarta(period.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderActionMenu(period)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada periode penilaian yang dibuat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Mobile (< md): Kartu Menyusun ke Bawah (Tanpa Horizontal Scroll) */}
      <div className="space-y-3 md:hidden">
        {sortedPeriods.length > 0 ? (
          sortedPeriods.map((period, idx) => (
            <Card
              key={period.id}
              className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3 gap-0"
            >
              {/* Header Kartu: Nomor, Status, dan Tombol Aksi */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      #{idx + 1}
                    </span>
                    {renderStatusBadge(period.status)}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground break-words leading-snug">
                    {period.nama}
                  </h3>
                </div>
                <div className="shrink-0 -mr-1">
                  {renderActionMenu(period)}
                </div>
              </div>

              {/* Detail Periode: Tanggal Mulai & Tanggal Akhir Menyusun ke Bawah */}
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/60 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium mb-0.5">
                    Tanggal Mulai
                  </span>
                  <span className="text-foreground font-medium">
                    {formatDateJakarta(period.tanggal_mulai)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium mb-0.5">
                    Tanggal Akhir
                  </span>
                  <span className="text-foreground font-medium">
                    {formatDateJakarta(period.tanggal_akhir)}
                  </span>
                </div>
              </div>

              {/* Tanggal Dibuat */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-[11px]">Dibuat</span>
                <span className="font-medium text-foreground">
                  {formatDateJakarta(period.created_at)}
                </span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada periode penilaian yang dibuat.
            </p>
          </Card>
        )}
      </div>

      {/* DIALOG 1: Tambah Periode */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              Buka Periode Penilaian Baru
            </DialogTitle>
            <DialogDescription>
              Tentukan rentang tanggal evaluasi. Status awal periode baru akan otomatis terbuka.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePeriod} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="periode-nama">Nama Periode</Label>
              <Input
                id="periode-nama"
                required
                placeholder="Contoh: Periode Penilaian Semester Ganjil 2026/2027"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tgl-mulai">Tanggal Mulai</Label>
                <DatePicker
                  id="tgl-mulai"
                  value={tanggalMulai}
                  onChange={(val) => {
                    setTanggalMulai(val)
                    if (tanggalAkhir && val && tanggalAkhir < val) {
                      setTanggalAkhir(val)
                    }
                  }}
                  maxDate={tanggalAkhir || undefined}
                  placeholder="Pilih tanggal mulai"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tgl-akhir">Tanggal Akhir</Label>
                <DatePicker
                  id="tgl-akhir"
                  value={tanggalAkhir}
                  onChange={(val) => setTanggalAkhir(val)}
                  minDate={tanggalMulai || undefined}
                  placeholder="Pilih tanggal akhir"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Buat Periode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Ubah Periode */}
      <Dialog
        open={!!editPeriod}
        onOpenChange={(open) => !open && setEditPeriod(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-primary" />
              Ubah Periode Penilaian
            </DialogTitle>
            <DialogDescription>
              Perbarui nama atau rentang waktu periode penilaian.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePeriod} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-periode-nama">Nama Periode</Label>
              <Input
                id="edit-periode-nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-tgl-mulai">Tanggal Mulai</Label>
                <DatePicker
                  id="edit-tgl-mulai"
                  value={tanggalMulai}
                  onChange={(val) => {
                    setTanggalMulai(val)
                    if (tanggalAkhir && val && tanggalAkhir < val) {
                      setTanggalAkhir(val)
                    }
                  }}
                  maxDate={tanggalAkhir || undefined}
                  placeholder="Pilih tanggal mulai"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-tgl-akhir">Tanggal Akhir</Label>
                <DatePicker
                  id="edit-tgl-akhir"
                  value={tanggalAkhir}
                  onChange={(val) => setTanggalAkhir(val)}
                  minDate={tanggalMulai || undefined}
                  placeholder="Pilih tanggal akhir"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPeriod(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Perbarui Periode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Konfirmasi Buka / Tutup Periode */}
      <Dialog
        open={!!statusDialog}
        onOpenChange={(open) => !open && setStatusDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusDialog?.targetStatus === "closed" ? (
                <>
                  <Lock className="size-5 text-amber-600" />
                  Tutup Periode Penilaian
                </>
              ) : (
                <>
                  <Unlock className="size-5 text-emerald-600" />
                  Buka Kembali Periode Penilaian
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {statusDialog?.targetStatus === "closed"
                ? `Setelah periode '${statusDialog?.period.nama}' ditutup, formulir penilaian ketua akan terkunci.`
                : `Apakah Anda ingin membuka kembali periode '${statusDialog?.period.nama}'?`}
            </DialogDescription>
          </DialogHeader>

          {statusDialog?.targetStatus === "closed" && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                <strong>Aturan PRD:</strong> Setelah periode berstatus ditutup, HANYA
                Super-Admin (Pimpinan) yang berwenang membuka kembali periode ini.
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusDialog(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              className={
                statusDialog?.targetStatus === "closed"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }
              onClick={handleConfirmToggleStatus}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {statusDialog?.targetStatus === "closed"
                ? "Konfirmasi Tutup Periode"
                : "Konfirmasi Buka Periode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Hapus Periode */}
      <Dialog
        open={!!deletePeriod}
        onOpenChange={(open) => !open && setDeletePeriod(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Hapus Periode Penilaian
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus periode{" "}
              <strong>{deletePeriod?.nama}</strong>?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Periode yang sudah memuat data lembar penilaian anggota tidak dapat dihapus. Anda dapat menutup periode untuk menghentikan pengisian baru.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePeriod(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePeriod}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Hapus Periode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
