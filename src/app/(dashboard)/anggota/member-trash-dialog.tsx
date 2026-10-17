"use client"

import * as React from "react"
import {
  Trash2,
  RotateCcw,
  Clock,
  Building2,
  IdCard,
  Briefcase,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
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
import { SortableHeader } from "@/components/ui/sortable-header"
import {
  getTrashMembersAction,
  restoreMemberAction,
  bulkRestoreMembersAction,
  hardDeleteMemberAction,
  emptyTrashAction,
  type TrashMemberItem,
} from "@/lib/actions/member"
import { UserRole } from "@/types/database"

interface MemberTrashDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: UserRole
  onTrashMutated: () => void
}

export function MemberTrashDialog({
  open,
  onOpenChange,
  userRole,
  onTrashMutated,
}: MemberTrashDialogProps) {
  const [items, setItems] = React.useState<TrashMemberItem[]>([])
  const [sortBy, setSortBy] = React.useState<
    "nama" | "department" | "jabatan" | "deleted_at" | "days_remaining"
  >("nama")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSort = (
    col: "nama" | "department" | "jabatan" | "deleted_at" | "days_remaining"
  ) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      if (sortBy === "nama") {
        cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
      } else if (sortBy === "department") {
        cmp = a.department_nama.localeCompare(b.department_nama, "id", { sensitivity: "base" })
      } else if (sortBy === "jabatan") {
        cmp = a.jabatan.localeCompare(b.jabatan, "id", { sensitivity: "base" })
      } else if (sortBy === "deleted_at") {
        cmp = new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime()
      } else if (sortBy === "days_remaining") {
        cmp = a.days_remaining - b.days_remaining
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [items, sortBy, sortOrder])
  const [restoringId, setRestoringId] = React.useState<string | null>(null)
  const [deletingTarget, setDeletingTarget] = React.useState<TrashMemberItem | null>(null)
  const [isDeletingPermanently, setIsDeletingPermanently] = React.useState(false)
  const [isRestoringAll, setIsRestoringAll] = React.useState(false)
  const [confirmEmptyOpen, setConfirmEmptyOpen] = React.useState(false)
  const [isEmptying, setIsEmptying] = React.useState(false)

  const canManage = userRole === "super_admin" || userRole === "user"

  const [, startTransition] = React.useTransition()

  // Muat data tempat sampah saat dialog dibuka
  React.useEffect(() => {
    let ignore = false

    if (open) {
      startTransition(async () => {
        setIsLoading(true)
        try {
          const res = await getTrashMembersAction()
          if (!ignore) {
            if (res.success && res.data) {
              setItems(res.data)
            } else {
              toast.error(res.error || "Gagal memuat tempat sampah")
            }
          }
        } catch {
          if (!ignore) {
            toast.error("Terjadi kesalahan saat memuat data tempat sampah")
          }
        } finally {
          if (!ignore) {
            setIsLoading(false)
          }
        }
      })
    }

    return () => {
      ignore = true
    }
  }, [open])

  // Pulihkan satu anggota
  async function handleRestore(item: TrashMemberItem) {
    setRestoringId(item.id)
    try {
      const res = await restoreMemberAction(item.id)
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan anggota")
        return
      }
      toast.success(res.message || `Anggota '${item.nama}' berhasil dipulihkan`)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      onTrashMutated()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setRestoringId(null)
    }
  }

  // Pulihkan semua anggota
  async function handleRestoreAll() {
    if (items.length === 0) return
    setIsRestoringAll(true)
    try {
      const ids = items.map((i) => i.id)
      const res = await bulkRestoreMembersAction(ids)
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan seluruh anggota")
        return
      }
      toast.success(res.message || "Seluruh data anggota berhasil dipulihkan")
      setItems([])
      onTrashMutated()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsRestoringAll(false)
    }
  }

  // Konfirmasi hapus permanen satu anggota
  async function confirmHardDelete() {
    if (!deletingTarget) return
    setIsDeletingPermanently(true)
    try {
      const res = await hardDeleteMemberAction(deletingTarget.id)
      if (!res.success) {
        toast.error(res.error || "Gagal menghapus permanen data")
        return
      }
      toast.error(res.message || "Data anggota berhasil dihapus permanen dari Supabase")
      setItems((prev) => prev.filter((i) => i.id !== deletingTarget.id))
      setDeletingTarget(null)
      onTrashMutated()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsDeletingPermanently(false)
    }
  }

  // Konfirmasi kosongkan tempat sampah
  async function confirmEmptyTrash() {
    setIsEmptying(true)
    try {
      const res = await emptyTrashAction()
      if (!res.success) {
        toast.error(res.error || "Gagal mengosongkan tempat sampah")
        return
      }
      toast.error(res.message || "Tempat sampah berhasil dikosongkan")
      setItems([])
      setConfirmEmptyOpen(false)
      onTrashMutated()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsEmptying(false)
    }
  }

  function formatDeletedDate(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  function getDaysRemainingBadge(days: number) {
    if (days <= 1) {
      return (
        <Badge variant="outline" className="border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 gap-1 text-[11px]">
          <Clock className="size-3 text-red-500 animate-pulse" />
          {days === 0 ? "Kedaluwarsa hari ini" : "1 hari tersisa"}
        </Badge>
      )
    }
    if (days <= 3) {
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 gap-1 text-[11px]">
          <Clock className="size-3 text-amber-500" />
          {days} hari tersisa
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-muted bg-muted/30 text-muted-foreground gap-1 text-[11px]">
        <Clock className="size-3 text-muted-foreground" />
        {days} hari tersisa
      </Badge>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {/* Header Dialog */}
          <DialogHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="size-9 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center">
                    <Trash2 className="size-5" />
                  </div>
                  Tempat Sampah Anggota
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {items.length}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-xs text-muted-foreground">
                  Data yang baru dihapus disimpan di sini dan akan otomatis <strong>dihapus permanen dari Supabase setelah 7 hari</strong>.
                </DialogDescription>
              </div>

              {/* Aksi Cepat Header */}
              {canManage && items.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreAll}
                    disabled={isRestoringAll || isLoading}
                    className="h-8 gap-1.5 text-xs cursor-pointer border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  >
                    {isRestoringAll ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    Pulihkan Semua
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmEmptyOpen(true)}
                    disabled={isEmptying || isLoading}
                    className="h-8 gap-1.5 text-xs cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    Kosongkan
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Konten Daftar Tempat Sampah */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-sm">Memeriksa data tempat sampah...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="size-14 rounded-full bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center">
                  <Trash2 className="size-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Tempat Sampah Kosong</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Tidak ada data anggota yang sedang berada di tempat sampah. Data yang telah dihapus lebih dari 7 hari otomatis dibersihkan secara permanen.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop View: Table (hidden di mobile) */}
                <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[30%]">
                          <SortableHeader
                            label="Nama Anggota"
                            direction={sortBy === "nama" ? sortOrder : false}
                            onToggle={() => handleSort("nama")}
                          />
                        </TableHead>
                        <TableHead>
                          <SortableHeader
                            label="Departemen"
                            direction={sortBy === "department" ? sortOrder : false}
                            onToggle={() => handleSort("department")}
                          />
                        </TableHead>
                        <TableHead>
                          <SortableHeader
                            label="Jabatan"
                            direction={sortBy === "jabatan" ? sortOrder : false}
                            onToggle={() => handleSort("jabatan")}
                          />
                        </TableHead>
                        <TableHead>
                          <SortableHeader
                            label="Dihapus Pada"
                            type="date"
                            direction={sortBy === "deleted_at" ? sortOrder : false}
                            onToggle={() => handleSort("deleted_at")}
                          />
                        </TableHead>
                        <TableHead>
                          <SortableHeader
                            label="Batas Simpan"
                            type="numeric"
                            direction={sortBy === "days_remaining" ? sortOrder : false}
                            onToggle={() => handleSort("days_remaining")}
                          />
                        </TableHead>
                        {canManage && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">
                            <div className="text-sm text-foreground font-semibold">{item.nama}</div>
                            {item.nip && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <IdCard className="size-3" />
                                NIG: {item.nip}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs flex items-center gap-1.5 text-foreground">
                              <Building2 className="size-3 text-muted-foreground" />
                              {item.department_nama}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Briefcase className="size-3" />
                              {item.jabatan}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDeletedDate(item.deleted_at)}
                          </TableCell>
                          <TableCell>
                            {getDaysRemainingBadge(item.days_remaining)}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestore(item)}
                                  disabled={restoringId === item.id}
                                  title="Pulihkan Anggota"
                                  className="h-8 gap-1 text-xs cursor-pointer border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                >
                                  {restoringId === item.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="size-3.5" />
                                  )}
                                  Pulihkan
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingTarget(item)}
                                  title="Hapus Permanen dari Supabase"
                                  className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View: Cards (block di mobile) */}
                <div className="space-y-3 sm:hidden">
                  {sortedItems.map((item) => (
                    <Card key={item.id} className="border border-border/80 shadow-xs">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{item.nama}</h4>
                            {item.nip && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <IdCard className="size-3" />
                                NIG: {item.nip}
                              </p>
                            )}
                          </div>
                          {getDaysRemainingBadge(item.days_remaining)}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-muted-foreground/80" />
                            <span>{item.department_nama}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="size-3.5 text-muted-foreground/80" />
                            <span>{item.jabatan}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-muted-foreground/80" />
                            <span>Dihapus: {formatDeletedDate(item.deleted_at)}</span>
                          </div>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(item)}
                              disabled={restoringId === item.id}
                              className="flex-1 h-8 gap-1.5 text-xs cursor-pointer border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            >
                              {restoringId === item.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3.5" />
                              )}
                              Pulihkan
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingTarget(item)}
                              className="h-8 gap-1.5 text-xs cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                              Hapus Permanen
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer Dialog */}
          <DialogFooter className="p-4 border-t border-border/60 bg-muted/15 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Sistem akan menghapus permanen data di atas secara otomatis setelah 7 hari kalender.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Hapus Permanen Satu Anggota */}
      <AlertDialog
        open={Boolean(deletingTarget)}
        onOpenChange={(open) => !open && setDeletingTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="size-11 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-foreground">
              Hapus Permanen Anggota?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs text-muted-foreground">
              <p>
                Anda akan menghapus data anggota <strong>&quot;{deletingTarget?.nama}&quot;</strong> secara <strong>permanen dari database Supabase</strong>.
              </p>
              <p className="font-medium text-destructive">
                ⚠️ Peringatan: Tindakan ini TIDAK DAPAT DIBATALKAN. Seluruh riwayat data dan lembar penilaian terkait anggota ini akan hilang sepenuhnya.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPermanently} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmHardDelete()
              }}
              disabled={isDeletingPermanently}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer gap-2"
            >
              {isDeletingPermanently ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menghapus Fisik...
                </>
              ) : (
                "Ya, Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Konfirmasi Kosongkan Tempat Sampah */}
      <AlertDialog
        open={confirmEmptyOpen}
        onOpenChange={setConfirmEmptyOpen}
      >
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="size-11 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mb-2">
              <Trash2 className="size-6" />
            </div>
            <AlertDialogTitle className="text-foreground">
              Kosongkan Tempat Sampah?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs text-muted-foreground">
              <p>
                Seluruh <strong>{items.length} data anggota</strong> yang ada di tempat sampah akan <strong>dihapus permanen dari Supabase saat ini juga</strong> tanpa menunggu batas 7 hari.
              </p>
              <p className="font-medium text-destructive">
                ⚠️ Peringatan: Tindakan ini permanen dan tidak dapat dipulihkan kembali.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEmptying} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmEmptyTrash()
              }}
              disabled={isEmptying}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer gap-2"
            >
              {isEmptying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengosongkan...
                </>
              ) : (
                "Ya, Kosongkan Semua"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
