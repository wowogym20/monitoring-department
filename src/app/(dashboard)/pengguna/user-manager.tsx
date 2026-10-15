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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  UsersRound,
  Shield,
  Briefcase,
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
  Info,
} from "lucide-react"
import { formatDateJakarta } from "@/lib/date"
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
  type UserItem,
  type DepartmentOption,
} from "@/lib/actions/users"
import { UserRole } from "@/types/database"

interface UserManagerProps {
  initialUsers: UserItem[]
  departments: DepartmentOption[]
  currentUserId: string
}

export function UserManager({
  initialUsers,
  departments = [],
  currentUserId,
}: UserManagerProps) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<
    "nama" | "email" | "role" | "no_hp" | "department" | "is_active" | "created_at"
  >("nama")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  // State Dialog Tambah Pengguna
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createNama, setCreateNama] = React.useState("")
  const [createEmail, setCreateEmail] = React.useState("")
  const [createPassword, setCreatePassword] = React.useState("")
  const [createNoHp, setCreateNoHp] = React.useState("")
  const [createRole, setCreateRole] = React.useState<UserRole>("user")
  const [createDeptId, setCreateDeptId] = React.useState<string>("unassigned")
  const [isCreating, setIsCreating] = React.useState(false)

  // State Dialog Edit Pengguna
  const [editUser, setEditUser] = React.useState<UserItem | null>(null)
  const [editNama, setEditNama] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editNoHp, setEditNoHp] = React.useState("")
  const [editRole, setEditRole] = React.useState<UserRole>("user")
  const [editDeptId, setEditDeptId] = React.useState<string>("unassigned")
  const [isEditing, setIsEditing] = React.useState(false)

  // State Dialog Reset Password
  const [resetUser, setResetUser] = React.useState<UserItem | null>(null)
  const [resetPasswordBaru, setResetPasswordBaru] = React.useState("")
  const [isResetting, setIsResetting] = React.useState(false)

  // State Konfirmasi Status & Hapus
  const [statusTarget, setStatusTarget] = React.useState<UserItem | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false)

  const [deleteTarget, setDeleteTarget] = React.useState<UserItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Filter & Pengurutan
  const filteredUsers = React.useMemo(() => {
    return initialUsers.filter((u) => {
      // Filter role
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false
      }

      // Filter status
      if (statusFilter === "active" && !u.is_active) return false
      if (statusFilter === "inactive" && u.is_active) return false

      // Pencarian
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const matchNama = u.nama.toLowerCase().includes(q)
      const matchEmail = u.email.toLowerCase().includes(q)
      const matchNoHp = u.no_hp ? u.no_hp.toLowerCase().includes(q) : false
      const matchDept = u.department ? u.department.nama.toLowerCase().includes(q) : false

      return matchNama || matchEmail || matchNoHp || matchDept
    })
  }, [initialUsers, search, roleFilter, statusFilter])

  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: string | number | boolean = ""
      let valB: string | number | boolean = ""

      switch (sortBy) {
        case "nama":
          valA = a.nama.toLowerCase()
          valB = b.nama.toLowerCase()
          break
        case "email":
          valA = a.email.toLowerCase()
          valB = b.email.toLowerCase()
          break
        case "role":
          valA = a.role
          valB = b.role
          break
        case "no_hp":
          valA = a.no_hp || ""
          valB = b.no_hp || ""
          break
        case "department":
          valA = a.department?.nama.toLowerCase() || ""
          valB = b.department?.nama.toLowerCase() || ""
          break
        case "is_active":
          valA = a.is_active ? 1 : 0
          valB = b.is_active ? 1 : 0
          break
        case "created_at":
          valA = new Date(a.created_at).getTime()
          valB = new Date(b.created_at).getTime()
          break
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1
      if (valA > valB) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredUsers, sortBy, sortOrder])

  const handleSort = (
    col: "nama" | "email" | "role" | "no_hp" | "department" | "is_active" | "created_at"
  ) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortOrder("asc")
    }
  }

  // Statistik Ringkas
  const totalCount = initialUsers.length
  const superAdminCount = initialUsers.filter((u) => u.role === "super_admin").length
  const sdmCount = initialUsers.filter((u) => u.role === "admin").length
  const ketuaCount = initialUsers.filter((u) => u.role === "user").length

  // Helper Render Badge Role
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold gap-1"
          >
            <Shield className="size-3" />
            Super Admin
          </Badge>
        )
      case "admin":
        return (
          <Badge
            variant="outline"
            className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold gap-1"
          >
            <Briefcase className="size-3" />
            SDM
          </Badge>
        )
      case "user":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold gap-1"
          >
            <UserCog className="size-3" />
            Ketua Departemen
          </Badge>
        )
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  // Helper Render Badge Status
  const renderStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        className={
          isActive
            ? "bg-emerald-700 text-white hover:bg-emerald-700"
            : "bg-muted text-muted-foreground hover:bg-muted"
        }
      >
        {isActive ? "Aktif" : "Nonaktif"}
      </Badge>
    )
  }

  // Handler Buka Edit
  const handleOpenEdit = (user: UserItem) => {
    setEditUser(user)
    setEditNama(user.nama)
    setEditEmail(user.email)
    setEditNoHp(user.no_hp || "")
    setEditRole(user.role)
    setEditDeptId(user.department?.id || "unassigned")
  }

  // Handler Submit Tambah Pengguna
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createNama.trim()) {
      toast.error("Nama lengkap pengguna wajib diisi.")
      return
    }

    if (!createEmail.trim()) {
      toast.error("Email login wajib diisi.")
      return
    }

    if (createPassword.length < 8) {
      toast.error("Password minimal 8 karakter.")
      return
    }

    setIsCreating(true)
    try {
      const res = await createUserAction({
        nama: createNama.trim(),
        email: createEmail.trim(),
        password: createPassword,
        no_hp: createNoHp.trim() || null,
        role: createRole,
        department_id:
          createRole === "user" && createDeptId !== "unassigned"
            ? createDeptId
            : null,
      })

      if (res.success) {
        toast.success(res.message)
        setIsCreateOpen(false)
        setCreateNama("")
        setCreateEmail("")
        setCreatePassword("")
        setCreateNoHp("")
        setCreateRole("user")
        setCreateDeptId("unassigned")
        router.refresh()
      } else {
        toast.error(res.error || "Gagal membuat pengguna.")
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat pengguna.")
    } finally {
      setIsCreating(false)
    }
  }

  // Handler Submit Edit Pengguna
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return

    if (!editNama.trim()) {
      toast.error("Nama lengkap pengguna wajib diisi.")
      return
    }

    if (!editEmail.trim()) {
      toast.error("Email login wajib diisi.")
      return
    }

    setIsEditing(true)
    try {
      const res = await updateUserAction({
        id: editUser.id,
        nama: editNama.trim(),
        email: editEmail.trim(),
        no_hp: editNoHp.trim() || null,
        role: editRole,
        department_id:
          editRole === "user" && editDeptId !== "unassigned"
            ? editDeptId
            : null,
      })

      if (res.success) {
        toast.success(res.message)
        setEditUser(null)
        router.refresh()
      } else {
        toast.error(res.error || "Gagal memperbarui pengguna.")
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui pengguna.")
    } finally {
      setIsEditing(false)
    }
  }

  // Handler Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUser) return

    if (resetPasswordBaru.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.")
      return
    }

    setIsResetting(true)
    try {
      const res = await resetUserPasswordAction({
        id: resetUser.id,
        passwordBaru: resetPasswordBaru,
      })

      if (res.success) {
        toast.success(res.message)
        setResetUser(null)
        setResetPasswordBaru("")
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mereset kata sandi.")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mereset kata sandi.")
    } finally {
      setIsResetting(false)
    }
  }

  // Handler Konfirmasi Toggle Status
  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return

    setIsTogglingStatus(true)
    try {
      const res = await toggleUserStatusAction({
        id: statusTarget.id,
        is_active: !statusTarget.is_active,
      })

      if (res.success) {
        toast.success(res.message)
        setStatusTarget(null)
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mengubah status akun.")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengubah status akun.")
    } finally {
      setIsTogglingStatus(false)
    }
  }

  // Handler Konfirmasi Hapus Pengguna
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const res = await deleteUserAction({ id: deleteTarget.id })

      if (res.success) {
        toast.success(res.message)
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(res.error || "Gagal menghapus pengguna.")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus pengguna.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Ringkasan Kartu Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Pengguna
            </CardTitle>
            <UsersRound className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Seluruh akun terdaftar di sistem
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-300">
              Super Admin
            </CardTitle>
            <Shield className="size-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {superAdminCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Administrator & Pimpinan Lembaga
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-sky-700 dark:text-sky-300">
              SDM (Admin)
            </CardTitle>
            <Briefcase className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              {sdmCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tim Verifikator & Evaluator SDM
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Ketua Departemen
            </CardTitle>
            <UserCog className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {ketuaCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kepala dari masing-masing departemen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Bar Aksi: Pencarian, Filter & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap sm:flex-nowrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, nomor HP, atau departemen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6 text-muted-foreground"
                onClick={() => setSearch("")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">SDM</SelectItem>
              <SelectItem value="user">Ketua Departemen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] text-xs">
              <SelectValue placeholder="Status Akun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Pengguna
        </Button>
      </div>

      {/* 3. Tampilan Desktop (>= md): Tabel Data */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">No.</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Nama Pengguna"
                    direction={sortBy === "nama" ? sortOrder : false}
                    onToggle={() => handleSort("nama")}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Email Login"
                    direction={sortBy === "email" ? sortOrder : false}
                    onToggle={() => handleSort("email")}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Role"
                    type="general"
                    direction={sortBy === "role" ? sortOrder : false}
                    onToggle={() => handleSort("role")}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Departemen Terkait"
                    direction={sortBy === "department" ? sortOrder : false}
                    onToggle={() => handleSort("department")}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="No. HP"
                    type="general"
                    direction={sortBy === "no_hp" ? sortOrder : false}
                    onToggle={() => handleSort("no_hp")}
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
                <TableHead>
                  <SortableHeader
                    label="Terdaftar"
                    type="date"
                    direction={sortBy === "created_at" ? sortOrder : false}
                    onToggle={() => handleSort("created_at")}
                  />
                </TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user, idx) => {
                  const initials = user.nama
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                  const isSelf = user.id === currentUserId

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            {user.foto_url && (
                              <AvatarImage src={user.foto_url} alt={user.nama} />
                            )}
                            <AvatarFallback className="text-xs bg-muted">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{user.nama}</span>
                              {isSelf && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  Anda
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>{renderRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.role === "user" ? (
                          user.department ? (
                            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                              <Building className="size-3.5 text-muted-foreground shrink-0" />
                              <span>{user.department.nama}</span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              Belum ditugaskan
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Lintas Departemen
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {user.no_hp || "-"}
                      </TableCell>
                      <TableCell>{renderStatusBadge(user.is_active)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateJakarta(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                              <Pencil className="size-4 mr-2" />
                              Edit Pengguna
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetUser(user)}>
                              <KeyRound className="size-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStatusTarget(user)}
                              disabled={isSelf && user.is_active}
                              title={
                                isSelf && user.is_active
                                  ? "Anda tidak dapat menonaktifkan akun sendiri"
                                  : undefined
                              }
                            >
                              {user.is_active ? (
                                <>
                                  <XCircle className="size-4 mr-2 text-orange-600" />
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
                              onClick={() => setDeleteTarget(user)}
                              disabled={isSelf}
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
                    colSpan={9}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Tidak ada data pengguna yang sesuai dengan kriteria pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Tampilan Mobile (< md): Kartu */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => {
            const initials = user.nama
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
            const isSelf = user.id === currentUserId

            return (
              <Card key={user.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        {user.foto_url && (
                          <AvatarImage src={user.foto_url} alt={user.nama} />
                        )}
                        <AvatarFallback className="text-xs bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{user.nama}</span>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1">
                              Anda
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(user.is_active)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <div>{renderRoleBadge(user.role)}</div>
                    {user.role === "user" && user.department && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Building className="size-3" />
                        {user.department.nama}
                      </Badge>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      No. HP: {user.no_hp || "-"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MoreHorizontal className="size-4 mr-1" />
                          <span>Opsi</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                          <Pencil className="size-4 mr-2" />
                          Edit Pengguna
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetUser(user)}>
                          <KeyRound className="size-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusTarget(user)}
                          disabled={isSelf && user.is_active}
                        >
                          {user.is_active ? (
                            <>
                              <XCircle className="size-4 mr-2 text-orange-600" />
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
                          onClick={() => setDeleteTarget(user)}
                          disabled={isSelf}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Hapus Akun
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
            Tidak ada pengguna yang sesuai.
          </div>
        )}
      </div>

      {/* 5. Dialog Tambah Pengguna Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru dengan memilih role: Super Admin, SDM, atau Ketua Departemen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-nama">Nama Lengkap *</Label>
              <Input
                id="create-nama"
                placeholder="Contoh: Ustadz Ahmad Fauzi, M.Pd."
                value={createNama}
                onChange={(e) => setCreateNama(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email Login *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="nama@tazakka.or.id"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password Awal *</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-nohp">Nomor WhatsApp / HP (Opsional)</Label>
              <Input
                id="create-nohp"
                placeholder="08123456789"
                value={createNoHp}
                onChange={(e) => setCreateNoHp(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-role">Role Pengguna *</Label>
              <Select
                value={createRole}
                onValueChange={(val) => setCreateRole(val as UserRole)}
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    Super Admin (Akses Penuh Tata Kelola & Sistem)
                  </SelectItem>
                  <SelectItem value="admin">
                    Koordinator (Verifikator & Rekapitulasi Lintas Departemen)
                  </SelectItem>
                  <SelectItem value="user">
                    Kepala Departemen (Evaluator Departemen)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createRole === "user" ? (
              <div className="space-y-1.5">
                <Label htmlFor="create-dept">Penugasan Departemen (Opsional)</Label>
                <Select value={createDeptId} onValueChange={setCreateDeptId}>
                  <SelectTrigger id="create-dept">
                    <SelectValue placeholder="Pilih Departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      Belum Ditugaskan / Kosong
                    </SelectItem>
                    {departments.map((d) => (
                      <SelectItem
                        key={d.id}
                        value={d.id}
                        disabled={Boolean(d.ketua_id)}
                      >
                        {d.nama} {d.ketua_id ? "(Sudah memiliki ketua)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Dapat ditentukan sekarang atau ditetapkan nanti melalui menu Departemen.
                </p>
              </div>
            ) : (
              <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                <Info className="size-4 shrink-0 text-sky-600" />
                <span>
                  Role {createRole === "super_admin" ? "Super Admin" : "SDM"} memiliki wewenang tingkat pusat dan hak akses sistem lintas seluruh departemen.
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                disabled={isCreating}
              >
                {isCreating && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                Simpan Pengguna
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Dialog Edit Pengguna */}
      <Dialog
        open={Boolean(editUser)}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui identitas, kontak, role, atau penugasan departemen pengguna.
            </DialogDescription>
          </DialogHeader>

          {editUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nama">Nama Lengkap *</Label>
                <Input
                  id="edit-nama"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email Login *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Mengubah email akan memperbarui kredensial login akun Supabase Auth secara langsung.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-nohp">Nomor WhatsApp / HP</Label>
                <Input
                  id="edit-nohp"
                  value={editNoHp}
                  onChange={(e) => setEditNoHp(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role">Role Pengguna *</Label>
                <Select
                  value={editRole}
                  onValueChange={(val) => setEditRole(val as UserRole)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">SDM</SelectItem>
                    <SelectItem value="user">Ketua Departemen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRole === "user" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dept">Penugasan Departemen</Label>
                  <Select value={editDeptId} onValueChange={setEditDeptId}>
                    <SelectTrigger id="edit-dept">
                      <SelectValue placeholder="Pilih Departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        Belum Ditugaskan / Kosong
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                          disabled={
                            Boolean(d.ketua_id) && d.ketua_id !== editUser.id
                          }
                        >
                          {d.nama}{" "}
                          {d.ketua_id === editUser.id
                            ? "(Saat Ini)"
                            : d.ketua_id
                            ? "(Sudah ada ketua lain)"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Info className="size-4 shrink-0 text-sky-600" />
                  <span>
                    Role {editRole === "super_admin" ? "Super Admin" : "SDM"} bertugas di tingkat lembaga dan memiliki akses lintas seluruh departemen.
                  </span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
                  disabled={isEditing}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  disabled={isEditing}
                >
                  {isEditing && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Dialog Reset Password */}
      <Dialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => !open && setResetUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              Atur kata sandi baru untuk akun {resetUser?.nama} ({resetUser?.email}).
            </DialogDescription>
          </DialogHeader>

          {resetUser && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-pwd">Kata Sandi Baru *</Label>
                <Input
                  id="reset-pwd"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={resetPasswordBaru}
                  onChange={(e) => setResetPasswordBaru(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResetUser(null)
                    setResetPasswordBaru("")
                  }}
                  disabled={isResetting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  disabled={isResetting}
                >
                  {isResetting && (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  )}
                  Perbarui Kata Sandi
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. Alert Konfirmasi Ubah Status (Aktif / Nonaktif) */}
      <AlertDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-600" />
              <span>
                {statusTarget?.is_active
                  ? "Nonaktifkan Akun Pengguna?"
                  : "Aktifkan Akun Pengguna?"}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.is_active
                ? `Akun '${statusTarget?.nama}' tidak akan dapat login ke dalam aplikasi sampai diaktifkan kembali.`
                : `Akun '${statusTarget?.nama}' akan diaktifkan kembali dan dapat login ke aplikasi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              disabled={isTogglingStatus}
              className={
                statusTarget?.is_active
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }
            >
              {isTogglingStatus && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              {statusTarget?.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 9. Alert Konfirmasi Hapus Akun */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              <span>Hapus Akun Pengguna Secara Permanen?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus akun login dan profil milik{" "}
              <strong>{deleteTarget?.nama}</strong> ({deleteTarget?.email}) secara
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
