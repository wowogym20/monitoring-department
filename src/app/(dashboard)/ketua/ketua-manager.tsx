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
import { PasswordInput } from "@/components/ui/password-input"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  UserCog,
  Plus,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Loader2,
  Search,
  X,
  Building,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { formatDateJakarta } from "@/lib/date"
import {
  createKetuaAction,
  updateKetuaAction,
  deleteKetuaAction,
  toggleKetuaStatusAction,
  resetKetuaPasswordAction,
  type KetuaAccountItem,
  type DepartmentOption,
} from "@/lib/actions/ketua"
import { cn } from "@/lib/utils"

interface KetuaManagerProps {
  initialAccounts: KetuaAccountItem[]
  departments: DepartmentOption[]
}

export function KetuaManager({ initialAccounts, departments = [] }: KetuaManagerProps) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [sortBy, setSortBy] = React.useState<
    "nama" | "email" | "no_hp" | "department" | "is_active" | "created_at"
  >("nama")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  const handleSort = (
    col: "nama" | "email" | "no_hp" | "department" | "is_active" | "created_at"
  ) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editAccount, setEditAccount] = React.useState<KetuaAccountItem | null>(null)
  const [deleteAccount, setDeleteAccount] = React.useState<KetuaAccountItem | null>(null)
  const [resetAccount, setResetAccount] = React.useState<KetuaAccountItem | null>(null)

  // Form Buat Akun Baru
  const [nama, setNama] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [noHp, setNoHp] = React.useState("")
  const [deptId, setDeptId] = React.useState("none")

  // Form Edit Akun
  const [editNama, setEditNama] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editNoHp, setEditNoHp] = React.useState("")
  const [editDeptId, setEditDeptId] = React.useState("none")

  // Form Reset Password
  const [newPassword, setNewPassword] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const filteredAccounts = React.useMemo(() => {
    let result = initialAccounts
    if (search.trim()) {
      const q = search.toLowerCase()
      result = initialAccounts.filter(
        (a) =>
          a.nama.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.department?.nama.toLowerCase() || "").includes(q) ||
          (a.department?.kode.toLowerCase() || "").includes(q)
      )
    }
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === "nama") {
        cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
      } else if (sortBy === "email") {
        cmp = a.email.localeCompare(b.email, "id", { sensitivity: "base" })
      } else if (sortBy === "no_hp") {
        cmp = (a.no_hp || "").localeCompare(b.no_hp || "", "id", { sensitivity: "base" })
      } else if (sortBy === "department") {
        const deptA = a.department?.nama || ""
        const deptB = b.department?.nama || ""
        cmp = deptA.localeCompare(deptB, "id", { sensitivity: "base" })
      } else if (sortBy === "is_active") {
        cmp = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)
      } else if (sortBy === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [initialAccounts, search, sortBy, sortOrder])

  // Opsi departemen yang belum memiliki ketua (untuk create)
  const availableDeptsForCreate = React.useMemo(() => {
    return departments.filter((d) => !d.ketua_id)
  }, [departments])

  // Opsi departemen untuk edit (departemen yang saat ini dipimpin ketua ini + departemen kosong)
  const availableDeptsForEdit = React.useMemo(() => {
    if (!editAccount) return []
    return departments.filter(
      (d) => !d.ketua_id || d.id === editAccount.department?.id
    )
  }, [departments, editAccount])

  // Action: Buka Modal Edit
  const openEditModal = (account: KetuaAccountItem) => {
    setEditAccount(account)
    setEditNama(account.nama)
    setEditEmail(account.email)
    setEditNoHp(account.no_hp || "")
    setEditDeptId(account.department?.id || "none")
  }

  // Action: Buat Akun Ketua Baru
  const handleCreateKetua = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createKetuaAction({
        nama,
        email,
        password,
        no_hp: noHp.trim() || null,
        department_id: deptId !== "none" ? deptId : null,
      })

      if (res.success) {
        toast.success(res.message)
        setCreateOpen(false)
        setNama("")
        setEmail("")
        setPassword("")
        setNoHp("")
        setDeptId("none")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat akun")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Edit Akun Ketua
  const handleUpdateKetua = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAccount) return
    setIsSubmitting(true)
    try {
      const res = await updateKetuaAction({
        id: editAccount.id,
        nama: editNama,
        email: editEmail,
        no_hp: editNoHp.trim() || null,
        department_id: editDeptId !== "none" ? editDeptId : null,
      })

      if (res.success) {
        toast.success(res.message)
        setEditAccount(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui akun ketua")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Hapus Akun Ketua
  const handleDeleteKetua = async () => {
    if (!deleteAccount) return
    setIsSubmitting(true)
    try {
      const res = await deleteKetuaAction(deleteAccount.id)
      if (res.success) {
        toast.success(res.message)
        setDeleteAccount(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menghapus akun ketua")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Toggle Aktif / Nonaktif
  const handleToggleStatus = async (account: KetuaAccountItem) => {
    try {
      const nextStatus = !account.is_active
      const res = await toggleKetuaStatusAction({
        id: account.id,
        is_active: nextStatus,
      })

      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status akun ketua")
    }
  }

  // Action: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetAccount) return
    setIsSubmitting(true)
    try {
      const res = await resetKetuaPasswordAction({
        id: resetAccount.id,
        passwordBaru: newPassword,
      })

      if (res.success) {
        toast.success(res.message)
        setResetAccount(null)
        setNewPassword("")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mereset kata sandi")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama, email, atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              aria-label="Hapus kata kunci pencarian"
              title="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button
          onClick={() => {
            setNama("")
            setEmail("")
            setPassword("")
            setNoHp("")
            setDeptId("none")
            setCreateOpen(true)
          }}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs justify-center"
        >
          <Plus className="size-4 mr-1.5" />
          Buat Akun Kadep Baru
        </Button>
      </div>

      {/* Tampilan Desktop & Tablet (>= md): Tabel Bebas Scroll Horizontal (Data Menumpuk ke Bawah) */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center text-xs">No.</TableHead>
              <TableHead className="w-[52%]">
                <SortableHeader
                  label="Kepala Departemen & Kontak"
                  direction={sortBy === "nama" ? sortOrder : false}
                  onToggle={() => handleSort("nama")}
                />
              </TableHead>
              <TableHead className="w-[38%]">
                <SortableHeader
                  label="Departemen & Registrasi"
                  direction={sortBy === "department" ? sortOrder : false}
                  onToggle={() => handleSort("department")}
                />
              </TableHead>
              <TableHead className="w-16 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account, idx) => {
                const initials = account.nama
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()

                return (
                  <TableRow key={account.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground align-top pt-3.5">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="size-9 shrink-0 mt-0.5">
                          {account.foto_url && (
                            <AvatarImage
                              src={account.foto_url}
                              alt={account.nama}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">
                              {account.nama}
                            </span>
                            <Badge
                              variant={account.is_active ? "default" : "secondary"}
                              className={cn(
                                "text-[10px] px-1.5 py-0 shrink-0",
                                account.is_active
                                  ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
                                  : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                              )}
                            >
                              {account.is_active ? (
                                <>
                                  <CheckCircle2 className="size-2.5 mr-1 shrink-0" />
                                  <span>Aktif</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-2.5 mr-1 shrink-0" />
                                  <span>Nonaktif</span>
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono flex-wrap">
                            <span className="truncate" title={account.email}>
                              {account.email}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{account.no_hp || "Tanpa No. HP"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1 min-w-0">
                        {account.department ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Building className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-foreground">
                              {account.department.nama}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-mono px-1 py-0 shrink-0"
                            >
                              {account.department.kode}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Belum ditugaskan
                          </span>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          Terdaftar: <span className="font-medium text-foreground">{formatDateJakarta(account.created_at)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top pt-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0"
                            aria-label="Aksi Akun"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => openEditModal(account)}>
                            <Pencil className="size-4 mr-2 text-primary" />
                            Edit Profil & Departemen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setResetAccount(account)
                              setNewPassword("")
                            }}
                          >
                            <KeyRound className="size-4 mr-2 text-primary" />
                            Reset Kata Sandi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(account)}
                          >
                            {account.is_active ? (
                              <>
                                <XCircle className="size-4 mr-2 text-amber-600" />
                                Nonaktifkan Akun
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4 mr-2 text-emerald-600" />
                                Aktifkan Akun
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteAccount(account)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Hapus Akun
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada akun ketua departemen yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Mobile: Kartu Akun Responsif Bebas Scroll Horizontal */}
      <div className="block md:hidden space-y-3">
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map((account) => {
            const initials = account.nama
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()

            return (
              <div
                key={`mobile-${account.id}`}
                className="rounded-lg border border-border bg-card p-3.5 space-y-3 shadow-2xs"
              >
                {/* Baris Atas: Avatar + Nama + Email & Status + Menu Aksi */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-9 shrink-0">
                      {account.foto_url && (
                        <AvatarImage
                          src={account.foto_url}
                          alt={account.nama}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {account.nama}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground truncate" title={account.email}>
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant={account.is_active ? "default" : "secondary"}
                      className={cn(
                        "text-[11px] px-2 py-0.5",
                        account.is_active
                          ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
                          : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                      )}
                    >
                      {account.is_active ? (
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 p-0 text-muted-foreground hover:text-foreground"
                          aria-label="Aksi Akun"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => openEditModal(account)}>
                          <Pencil className="size-4 mr-2 text-primary" />
                          Edit Profil & Departemen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setResetAccount(account)
                            setNewPassword("")
                          }}
                        >
                          <KeyRound className="size-4 mr-2 text-primary" />
                          Reset Kata Sandi
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(account)}
                        >
                          {account.is_active ? (
                            <>
                              <XCircle className="size-4 mr-2 text-amber-600" />
                              Nonaktifkan Akun
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-4 mr-2 text-emerald-600" />
                              Aktifkan Akun
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteAccount(account)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Hapus Akun
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Rincian Departemen & Info Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Departemen:</span>
                    {account.department ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground truncate">
                          {account.department.nama}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono px-1 py-0 shrink-0"
                        >
                          {account.department.kode}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground mt-0.5 block">
                        Belum ditugaskan
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">No. HP / Kontak:</span>
                    <span className="font-mono text-xs text-foreground mt-0.5 block">
                      {account.no_hp || "-"}
                    </span>
                  </div>
                </div>

                {/* Footer: Tanggal Terdaftar & Tombol Cepat Aksi */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span>
                    Terdaftar: <strong className="font-medium text-foreground">{formatDateJakarta(account.created_at)}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 font-medium"
                      onClick={() => openEditModal(account)}
                    >
                      <Pencil className="size-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 font-medium text-primary hover:text-primary"
                      onClick={() => {
                        setResetAccount(account)
                        setNewPassword("")
                      }}
                    >
                      <KeyRound className="size-3" />
                      <span>Sandi</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground bg-card rounded-lg border border-dashed">
            Tidak ada akun ketua departemen yang ditemukan.
          </div>
        )}
      </div>

      {/* DIALOG 1: Buat Akun Ketua Baru */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              Buat Akun Kepala Departemen Baru
            </DialogTitle>
            <DialogDescription>
              Akun akan dibuat di sistem autentikasi dengan peran Kepala Departemen (user).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateKetua} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ketua-nama">Nama Lengkap</Label>
              <Input
                id="ketua-nama"
                required
                placeholder="Contoh: Ustadz Ahmad Fauzi, S.Pd.I."
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ketua-email">Alamat Email (Login)</Label>
              <Input
                id="ketua-email"
                type="email"
                required
                placeholder="contoh: ketua.kehumasan@tazakka.or.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ketua-pass">Kata Sandi Awal</Label>
              <PasswordInput
                id="ketua-pass"
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Ketua dapat memperbarui kata sandi ini setelah masuk melalui halaman profil.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ketua-hp">Nomor HP / WhatsApp (Opsional)</Label>
              <Input
                id="ketua-hp"
                placeholder="Contoh: 081234567890"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ketua-dept">Departemen yang Dipimpin (Opsional)</Label>
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger id="ketua-dept" className="w-full">
                  <SelectValue placeholder="Pilih departemen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum Ditugaskan</SelectItem>
                  {availableDeptsForCreate.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama} ({d.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Hanya departemen aktif yang belum memiliki ketua yang ditampilkan dalam daftar.
              </p>
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
                Buat Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Edit Akun Ketua & Departemen */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              Edit Akun & Departemen Ketua
            </DialogTitle>
            <DialogDescription>
              Perbarui profil, alamat email login, nomor kontak, atau penetapan departemen ketua.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateKetua} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nama">Nama Lengkap</Label>
              <Input
                id="edit-nama"
                required
                placeholder="Nama lengkap ketua"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Alamat Email (Login)</Label>
              <Input
                id="edit-email"
                type="email"
                required
                placeholder="contoh: ketua@tazakka.or.id"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Mengubah email akan memperbarui akun login Anda secara langsung.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-hp">Nomor HP / WhatsApp (Opsional)</Label>
              <Input
                id="edit-hp"
                placeholder="Contoh: 081234567890"
                value={editNoHp}
                onChange={(e) => setEditNoHp(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-dept">Departemen yang Dipimpin</Label>
              <Select value={editDeptId} onValueChange={setEditDeptId}>
                <SelectTrigger id="edit-dept" className="w-full">
                  <SelectValue placeholder="Pilih departemen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum Ditugaskan</SelectItem>
                  {availableDeptsForEdit.map((d) => {
                    const isCurrent = d.id === editAccount?.department?.id
                    return (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nama} ({d.kode}) {isCurrent ? "— (Saat ini)" : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Pilih &quot;Belum Ditugaskan&quot; untuk melepaskan tugas ketua dari departemen saat ini.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAccount(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Konfirmasi Hapus Akun Ketua (Alert Dialog) */}
      <AlertDialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              Hapus Akun Kepala Departemen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Apakah Anda yakin ingin menghapus akun ketua{" "}
                <strong className="text-foreground">{deleteAccount?.nama}</strong> (
                {deleteAccount?.email})?
              </p>
              <p className="text-muted-foreground text-xs">
                Tindakan ini akan menghapus akun login dan profil ketua secara permanen dari sistem.
                Jika ketua telah memiliki riwayat penilaian evaluasi, penghapusan akan ditolak otomatis demi integritas data.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteKetua()
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG 4: Reset Kata Sandi */}
      <Dialog
        open={!!resetAccount}
        onOpenChange={(open) => !open && setResetAccount(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              Reset Kata Sandi Akun
            </DialogTitle>
            <DialogDescription>
              Atur kata sandi baru untuk <strong>{resetAccount?.nama}</strong> (
              {resetAccount?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pass">Kata Sandi Baru</Label>
              <PasswordInput
                id="reset-pass"
                required
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetAccount(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Reset Kata Sandi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
