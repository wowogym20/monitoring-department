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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  UserCog,
  Plus,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Loader2,
  Search,
  Building,
} from "lucide-react"
import { formatDateJakarta } from "@/lib/date"
import {
  createKetuaAction,
  toggleKetuaStatusAction,
  resetKetuaPasswordAction,
  type KetuaAccountItem,
} from "@/lib/actions/ketua"

interface KetuaManagerProps {
  initialAccounts: KetuaAccountItem[]
}

export function KetuaManager({ initialAccounts }: KetuaManagerProps) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [resetAccount, setResetAccount] = React.useState<KetuaAccountItem | null>(null)

  // Form Buat Akun Baru
  const [nama, setNama] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [noHp, setNoHp] = React.useState("")

  // Form Reset Password
  const [newPassword, setNewPassword] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const filteredAccounts = React.useMemo(() => {
    if (!search.trim()) return initialAccounts
    const q = search.toLowerCase()
    return initialAccounts.filter(
      (a) =>
        a.nama.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.department?.nama.toLowerCase() || "").includes(q) ||
        (a.department?.kode.toLowerCase() || "").includes(q)
    )
  }, [initialAccounts, search])

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
      })

      if (res.success) {
        toast.success(res.message)
        setCreateOpen(false)
        setNama("")
        setEmail("")
        setPassword("")
        setNoHp("")
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
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        <Button
          onClick={() => {
            setNama("")
            setEmail("")
            setPassword("")
            setNoHp("")
            setCreateOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
        >
          <Plus className="size-4 mr-1.5" />
          Buat Akun Ketua Baru
        </Button>
      </div>

      {/* Tabel Akun Ketua */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Ketua</TableHead>
              <TableHead>Email Login</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Departemen Terkait</TableHead>
              <TableHead>Status Akun</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
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
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
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
                        <span className="font-medium text-foreground">
                          {account.nama}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {account.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {account.no_hp || "-"}
                    </TableCell>
                    <TableCell>
                      {account.department ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium">
                            {account.department.nama}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono px-1 py-0"
                          >
                            {account.department.kode}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Belum ditugaskan
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={account.is_active ? "default" : "secondary"}
                        className={
                          account.is_active
                            ? "bg-emerald-700 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white"
                            : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                        }
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
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateJakarta(account.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setResetAccount(account)
                              setNewPassword("")
                            }}
                          >
                            <KeyRound className="size-4 mr-2 text-primary" />
                            Reset Kata Sandi
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada akun ketua departemen yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG 1: Buat Akun Ketua Baru */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              Buat Akun Ketua Baru
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
              <Input
                id="ketua-pass"
                type="password"
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

      {/* DIALOG 2: Reset Kata Sandi */}
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
              <Input
                id="reset-pass"
                type="password"
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
