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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
  ListOrdered,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react"
import {
  createAspectAction,
  updateAspectAction,
  toggleAspectStatusAction,
  reorderAspectAction,
  deleteAspectAction,
} from "@/lib/actions/aspek"
import { AssessmentAspect, UserRole } from "@/types/database"
import { cn } from "@/lib/utils"

interface AspekManagerProps {
  initialAspects: AssessmentAspect[]
  currentUserRole: UserRole
}

export function AspekManager({
  initialAspects,
  currentUserRole,
}: AspekManagerProps) {
  const router = useRouter()
  const isSuperAdmin = currentUserRole === "super_admin" || currentUserRole === "admin"

  // Dialog states
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editAspect, setEditAspect] = React.useState<AssessmentAspect | null>(null)
  const [deleteAspect, setDeleteAspect] = React.useState<AssessmentAspect | null>(null)

  // Form states
  const [nama, setNama] = React.useState("")
  const [deskripsi, setDeskripsi] = React.useState("")
  const [urutan, setUrutan] = React.useState<number>(initialAspects.length + 1)
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<"urutan" | "nama" | "deskripsi" | "is_active">("urutan")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  const handleSort = (col: "urutan" | "nama" | "deskripsi" | "is_active") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

  // Sort aspects by kolom yang dipilih
  const sortedAspects = React.useMemo(() => {
    return [...initialAspects].sort((a, b) => {
      let cmp = 0
      if (sortBy === "urutan") {
        cmp = a.urutan - b.urutan
      } else if (sortBy === "nama") {
        cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
      } else if (sortBy === "deskripsi") {
        cmp = (a.deskripsi || "").localeCompare(b.deskripsi || "", "id", { sensitivity: "base" })
      } else if (sortBy === "is_active") {
        cmp = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [initialAspects, sortBy, sortOrder])

  // Action: Tambah Aspek
  const handleCreateAspect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createAspectAction({
        nama,
        deskripsi: deskripsi.trim() || null,
        urutan,
        is_active: isActive,
      })
      if (res.success) {
        toast.success(res.message)
        setCreateOpen(false)
        setNama("")
        setDeskripsi("")
        setIsActive(true)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menambahkan aspek penilaian")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Ubah Aspek
  const handleUpdateAspect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAspect) return
    setIsSubmitting(true)
    try {
      const res = await updateAspectAction({
        id: editAspect.id,
        nama,
        deskripsi: deskripsi.trim() || null,
        urutan,
        is_active: isActive,
      })
      if (res.success) {
        toast.success(res.message)
        setEditAspect(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal memperbarui aspek penilaian")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Reorder (Naik / Turun)
  const handleReorder = async (aspectId: string, direction: "up" | "down") => {
    try {
      const res = await reorderAspectAction({ id: aspectId, direction })
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah urutan aspek")
    }
  }

  // Action: Toggle Status
  const handleToggleStatus = async (aspect: AssessmentAspect) => {
    try {
      const nextStatus = !aspect.is_active
      const res = await toggleAspectStatusAction(aspect.id, nextStatus)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status aspek")
    }
  }

  // Action: Hapus Aspek
  const handleDeleteAspect = async () => {
    if (!deleteAspect) return
    setIsSubmitting(true)
    try {
      const res = await deleteAspectAction(deleteAspect.id)
      if (res.success) {
        toast.error(res.message)
        setDeleteAspect(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menghapus aspek")
    } finally {
      setIsSubmitting(false)
    }
  }

  // PRD 8 Skala Likert Data
  const LIKERT_SCALES = [
    {
      nilai: 5,
      label: "Sangat Baik",
      arti: "Konsisten melampaui harapan, layak jadi teladan",
      badgeClass: "bg-emerald-700 text-white dark:bg-emerald-700",
    },
    {
      nilai: 4,
      label: "Baik",
      arti: "Memenuhi dan sering melampaui harapan",
      badgeClass:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300",
    },
    {
      nilai: 3,
      label: "Cukup",
      arti: "Memenuhi standar minimum",
      badgeClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300",
    },
    {
      nilai: 2,
      label: "Kurang",
      arti: "Di bawah harapan, perlu perbaikan nyata",
      badgeClass:
        "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300",
    },
    {
      nilai: 1,
      label: "Sangat Kurang",
      arti: "Jauh di bawah harapan, perlu pembinaan serius",
      badgeClass: "bg-orange-700 text-white dark:bg-orange-800",
    },
  ]

  return (
    <div className="space-y-8">
      {/* BAGIAN 1: Tabel Daftar Aspek Penilaian */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ListOrdered className="size-5 text-primary" />
              Daftar Aspek Penilaian Kinerja
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Setiap aspek berbobot sama dan dihitung rata-ratanya pada lembar penilaian anggota.
            </p>
          </div>

          {isSuperAdmin && (
            <Button
              onClick={() => {
                setNama("")
                setDeskripsi("")
                setUrutan(sortedAspects.length + 1)
                setIsActive(true)
                setCreateOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
            >
              <Plus className="size-4 mr-1.5" />
              Tambah Aspek Baru
            </Button>
          )}
        </div>

        {/* Tampilan Desktop: Tabel Standar 6 Kolom */}
        <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    <SortableHeader
                      label="Urutan"
                      type="numeric"
                      direction={sortBy === "urutan" ? sortOrder : false}
                      onToggle={() => handleSort("urutan")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Nama Aspek"
                      direction={sortBy === "nama" ? sortOrder : false}
                      onToggle={() => handleSort("nama")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Deskripsi / Rubrik Penilaian"
                      direction={sortBy === "deskripsi" ? sortOrder : false}
                      onToggle={() => handleSort("deskripsi")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Status"
                      type="general"
                      direction={sortBy === "is_active" ? sortOrder : false}
                      onToggle={() => handleSort("is_active")}
                    />
                  </TableHead>
                  {isSuperAdmin && (
                    <>
                      <TableHead className="w-28 text-center">Atur Urutan</TableHead>
                      <TableHead className="text-right w-20">Aksi</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAspects.length > 0 ? (
                  sortedAspects.map((aspect, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === sortedAspects.length - 1

                    return (
                      <TableRow key={aspect.id}>
                        <TableCell className="font-mono font-bold text-center">
                          <Badge variant="outline" className="font-mono text-xs">
                            {aspect.urutan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {aspect.nama}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {aspect.deskripsi || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={aspect.is_active ? "default" : "secondary"}
                            className={
                              aspect.is_active
                                ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
                                : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                            }
                          >
                            {aspect.is_active ? (
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
                        </TableCell>
                        {isSuperAdmin && (
                          <>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  disabled={isFirst}
                                  onClick={() => handleReorder(aspect.id, "up")}
                                  title="Pindah ke Atas"
                                  aria-label="Naikkan urutan"
                                >
                                  <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  disabled={isLast}
                                  onClick={() => handleReorder(aspect.id, "down")}
                                  title="Pindah ke Bawah"
                                  aria-label="Turunkan urutan"
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 p-0"
                                    aria-label="Aksi Aspek"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditAspect(aspect)
                                      setNama(aspect.nama)
                                      setDeskripsi(aspect.deskripsi || "")
                                      setUrutan(aspect.urutan)
                                      setIsActive(aspect.is_active)
                                    }}
                                  >
                                    <Edit className="size-4 mr-2" />
                                    Ubah Aspek
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(aspect)}
                                  >
                                    {aspect.is_active ? (
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
                                    onClick={() => setDeleteAspect(aspect)}
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Hapus Aspek
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isSuperAdmin ? 6 : 4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Belum ada aspek penilaian yang dikonfigurasi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Tampilan Mobile: Kartu Responsif Bebas Scroll Horizontal (Optimal untuk HP 360px+) */}
        <div className="block md:hidden space-y-3">
          {sortedAspects.length > 0 ? (
            sortedAspects.map((aspect, idx) => {
              const isFirst = idx === 0
              const isLast = idx === sortedAspects.length - 1

              return (
                <div
                  key={`mobile-${aspect.id}`}
                  className="rounded-lg border border-border bg-card p-3.5 space-y-3 shadow-2xs"
                >
                  {/* Top Bar: Urutan + Nama + Status & Menu Aksi */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs font-bold px-2 py-0.5 bg-muted/40 shrink-0 mt-0.5"
                      >
                        #{aspect.urutan}
                      </Badge>
                      <h3 className="font-bold text-sm text-foreground leading-snug">
                        {aspect.nama}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={aspect.is_active ? "default" : "secondary"}
                        className={cn(
                          "text-[11px] px-2 py-0.5",
                          aspect.is_active
                            ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
                            : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                        )}
                      >
                        {aspect.is_active ? (
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

                      {isSuperAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 p-0 text-muted-foreground hover:text-foreground"
                              aria-label="Aksi Aspek"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditAspect(aspect)
                                setNama(aspect.nama)
                                setDeskripsi(aspect.deskripsi || "")
                                setUrutan(aspect.urutan)
                                setIsActive(aspect.is_active)
                              }}
                            >
                              <Edit className="size-4 mr-2" />
                              Ubah Aspek
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(aspect)}
                            >
                              {aspect.is_active ? (
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
                              onClick={() => setDeleteAspect(aspect)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Hapus Aspek
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Body: Deskripsi / Panduan Rubrik */}
                  <div className="rounded-md bg-muted/30 border border-border/50 p-2.5 text-xs text-muted-foreground leading-relaxed">
                    {aspect.deskripsi || (
                      <span className="italic text-muted-foreground/80">
                        Belum ada panduan rubrik untuk aspek ini.
                      </span>
                    )}
                  </div>

                  {/* Footer (Khusus Super Admin): Kontrol Urutan Sentuh Ramah Jempol */}
                  {isSuperAdmin && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Atur Posisi Tampilan:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7.5 px-2.5 text-xs gap-1"
                          disabled={isFirst}
                          onClick={() => handleReorder(aspect.id, "up")}
                          aria-label="Naikkan urutan"
                        >
                          <ArrowUp className="size-3.5" />
                          <span>Naik</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7.5 px-2.5 text-xs gap-1"
                          disabled={isLast}
                          onClick={() => handleReorder(aspect.id, "down")}
                          aria-label="Turunkan urutan"
                        >
                          <ArrowDown className="size-3.5" />
                          <span>Turun</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground bg-card rounded-lg border border-dashed">
              Belum ada aspek penilaian yang dikonfigurasi.
            </div>
          )}
        </div>
      </div>

      {/* BAGIAN 2: Referensi Baca-Saja Skala Likert 1-5 (PRD Bagian 8) */}
      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-secondary" />
            <CardTitle className="text-lg font-bold">
              Panduan Skala Penilaian Likert (Skala 1–5)
            </CardTitle>
          </div>
          <CardDescription>
            Referensi resmi pedoman skor bagi seluruh ketua departemen agar penilaian seragam dan objektif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {LIKERT_SCALES.map((scale) => (
              <div
                key={scale.nilai}
                className="flex flex-col p-4 rounded-lg border border-border bg-card/60 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-foreground">
                    {scale.nilai}
                  </span>
                  <Badge className={scale.badgeClass}>{scale.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {scale.arti}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: Tambah Aspek */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" />
              Tambah Aspek Penilaian Baru
            </DialogTitle>
            <DialogDescription>
              Tentukan nama aspek, deskripsi singkat rubrik, dan nomor urutan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAspect} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="aspek-nama">Nama Aspek</Label>
              <Input
                id="aspek-nama"
                required
                placeholder="Contoh: Kinerja Kerja"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aspek-desc">Deskripsi Rubrik (Panduan Singkat)</Label>
              <Textarea
                id="aspek-desc"
                rows={3}
                placeholder="Contoh: Kualitas, ketepatan, dan penyelesaian tugas"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aspek-urutan">Nomor Urutan Tampilan</Label>
              <Input
                id="aspek-urutan"
                type="number"
                min={1}
                required
                value={urutan}
                onChange={(e) => setUrutan(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="aspek-active">Status Keaktifan</Label>
                <p className="text-xs text-muted-foreground">
                  Aspek aktif akan dimunculkan pada lembar formulir penilaian ketua.
                </p>
              </div>
              <Switch
                id="aspek-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
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
                Simpan Aspek
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Ubah Aspek */}
      <Dialog
        open={!!editAspect}
        onOpenChange={(open) => !open && setEditAspect(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-primary" />
              Ubah Aspek Penilaian
            </DialogTitle>
            <DialogDescription>
              Perbarui rincian nama atau panduan rubrik aspek penilaian.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAspect} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-aspek-nama">Nama Aspek</Label>
              <Input
                id="edit-aspek-nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-aspek-desc">Deskripsi Rubrik</Label>
              <Textarea
                id="edit-aspek-desc"
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-aspek-urutan">Nomor Urutan Tampilan</Label>
              <Input
                id="edit-aspek-urutan"
                type="number"
                min={1}
                required
                value={urutan}
                onChange={(e) => setUrutan(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-aspek-active">Status Keaktifan</Label>
                <p className="text-xs text-muted-foreground">
                  Aspek aktif akan dimunculkan pada lembar formulir penilaian ketua.
                </p>
              </div>
              <Switch
                id="edit-aspek-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAspect(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Perbarui Aspek
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Hapus Aspek */}
      <Dialog
        open={!!deleteAspect}
        onOpenChange={(open) => !open && setDeleteAspect(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Hapus Aspek Penilaian
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus aspek <strong>{deleteAspect?.nama}</strong>?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Aspek yang sudah memiliki data skor di lembar penilaian terdahulu tidak dapat dihapus. Anda disarankan menonaktifkan status keaktifannya.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteAspect(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAspect}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Hapus Aspek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
