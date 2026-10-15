"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Loader2,
  Camera,
  Upload,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Building2,
  UserCircle,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  updateProfileSchema,
  updatePasswordSchema,
  UpdateProfileInput,
  UpdatePasswordInput,
} from "@/lib/validations/auth"
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/auth"
import { uploadAvatarAction, deleteAvatarAction } from "@/lib/actions/avatar"
import { UserRole } from "@/types/database"
import { cn } from "@/lib/utils"

export interface AccountProfileCardProps {
  initialFotoUrl: string | null
  nama: string
  email: string
  role: UserRole
  isActive: boolean
  departmentNama?: string | null
}

export function AccountProfileCard({
  initialFotoUrl,
  nama,
  email,
  role,
  isActive,
  departmentNama,
}: AccountProfileCardProps) {
  const [isPending, startTransition] = React.useTransition()
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialFotoUrl)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const initials = nama
    ? nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const roleLabels: Record<
    UserRole,
    { label: string; badgeClass: string }
  > = {
    super_admin: {
      label: "Super-Admin (Pimpinan)",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    },
    admin: {
      label: "Koordinator",
      badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
    },
    user: {
      label: "Kepala Departemen",
      badgeClass: "bg-muted text-foreground border-border",
    },
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran berkas maksimal 2MB")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      try {
        const result = await uploadAvatarAction(formData)
        if (result.success && result.fotoUrl) {
          setPreviewUrl(result.fotoUrl)
          toast.success(result.message || "Foto profil berhasil diperbarui")
        } else {
          toast.error(result.error || "Gagal mengunggah foto profil")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah foto"
        )
      }
    })
  }

  const handleDeleteAvatar = () => {
    startTransition(async () => {
      try {
        const result = await deleteAvatarAction()
        if (result.success) {
          setPreviewUrl(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
          toast.success(result.message || "Foto profil berhasil dihapus")
        } else {
          toast.error(result.error || "Gagal menghapus foto profil")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menghapus foto profil"
        )
      }
    })
  }

  return (
    <Card className="border border-border/80 shadow-xs overflow-hidden bg-card gap-0 py-0">
      <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="size-7 sm:size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <UserCircle className="size-3.5 sm:size-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
              Informasi Akun &amp; Foto Profil
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Informasi peran dan atribusi departemen ditetapkan oleh sistem. Anda dapat memperbarui foto profil kapan saja.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 md:gap-6">
          {/* Bagian Foto Profil */}
          <div className="flex flex-col items-center text-center shrink-0 w-full sm:w-auto sm:min-w-[160px]">
            <div className="relative group mb-2.5">
              <Avatar className="size-20 sm:size-22 ring-2 ring-primary/20 border border-border shadow-2xs">
                {previewUrl && (
                  <AvatarImage
                    src={previewUrl}
                    alt={nama}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-medium gap-1"
                title="Klik untuk ubah foto"
              >
                <Camera className="size-5" />
                <span>Ubah</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={isPending}
            />

            <div className="flex flex-col items-center gap-1.5 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="h-7.5 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin text-primary" />
                ) : (
                  <Upload className="size-3" />
                )}
                <span>Pilih Foto Baru</span>
              </Button>

              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={isPending}
                  className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 rounded-md cursor-pointer transition-colors"
                  title="Hapus foto profil dan gunakan avatar default"
                >
                  <Trash2 className="size-3" />
                  <span>Hapus Foto</span>
                </Button>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
              JPG, PNG, atau WebP (maks. 2MB)
            </p>
          </div>

          {/* Garis Pembatas Vertikal (Desktop/Tablet) / Horizontal (Mobile) */}
          <div className="hidden sm:block w-px self-stretch bg-border/60 my-0.5" />
          <div className="block sm:hidden h-px w-full bg-border/60 my-1" />

          {/* Bagian Informasi Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* 1. Email Akun */}
            <div className="space-y-0.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3 text-primary shrink-0" />
                <span>Email Akun</span>
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={email}>
                {email}
              </p>
            </div>

            {/* 2. Peran Pengguna */}
            <div className="space-y-0.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-primary shrink-0" />
                <span>Peran Pengguna (Role)</span>
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={cn("text-[11px] font-medium px-2 py-0.5", roleLabels[role]?.badgeClass)}
                >
                  {roleLabels[role]?.label || role}
                </Badge>
              </div>
            </div>

            {/* 3. Status Akun */}
            <div className="space-y-0.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-primary shrink-0" />
                <span>Status Akun</span>
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                      : "bg-destructive/15 text-destructive border-destructive/25"
                  )}
                >
                  {isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>

            {/* 4. Departemen yang Dipimpin (jika role user / ketua departemen) */}
            {role === "user" && (
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3 text-primary shrink-0" />
                  <span>Departemen yang Dipimpin</span>
                </span>
                <div className="p-2 px-2.5 rounded-md bg-muted/40 border border-border/60">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    {departmentNama || "Belum ditugaskan ke departemen"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Kompatibilitas mundur
export function AvatarUploadForm({
  initialFotoUrl,
  nama,
}: {
  initialFotoUrl: string | null
  nama: string
}) {
  return (
    <AccountProfileCard
      initialFotoUrl={initialFotoUrl}
      nama={nama}
      email=""
      role="user"
      isActive={true}
    />
  )
}

interface EditProfileFormProps {
  initialNama: string
  initialNoHp: string | null
}

export function EditProfileForm({
  initialNama,
  initialNoHp,
}: EditProfileFormProps) {
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nama: initialNama,
      no_hp: initialNoHp || "",
    },
  })

  function onSubmit(data: UpdateProfileInput) {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(data)
        if (result.success) {
          toast.success(result.message || "Profil berhasil diperbarui")
        } else {
          toast.error(result.error || "Gagal memperbarui profil")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memperbarui profil"
        )
      }
    })
  }

  return (
    <Card className="border border-border shadow-xs gap-0 py-0 overflow-hidden flex flex-col">
      <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 border-b border-border/50">
        <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
          Informasi Personal
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Ubah nama lengkap dan nomor kontak Anda.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
        <CardContent className="p-3.5 sm:p-4 space-y-3 flex-1">
          <div className="space-y-1.5">
            <Label htmlFor="nama" className="text-xs font-medium">Nama Lengkap</Label>
            <Input
              id="nama"
              placeholder="Masukkan nama lengkap"
              disabled={isPending}
              className="h-9 text-xs sm:text-sm"
              {...register("nama")}
            />
            {errors.nama && (
              <p className="text-xs text-destructive">{errors.nama.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="no_hp" className="text-xs font-medium">Nomor HP / WhatsApp</Label>
            <Input
              id="no_hp"
              placeholder="Contoh: 081234567890"
              disabled={isPending}
              className="h-9 text-xs sm:text-sm"
              {...register("no_hp")}
            />
            {errors.no_hp && (
              <p className="text-xs text-destructive">{errors.no_hp.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 sm:p-3.5 border-t border-border/40 bg-muted/15 flex justify-end">
          <Button type="submit" disabled={isPending} className="h-8.5 px-3.5 text-xs sm:text-sm font-semibold">
            {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Simpan Perubahan
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export function UpdatePasswordForm() {
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      passwordBaru: "",
      konfirmasiPassword: "",
    },
  })

  function onSubmit(data: UpdatePasswordInput) {
    startTransition(async () => {
      try {
        const result = await updatePasswordAction(data)
        if (result.success) {
          toast.success(result.message || "Password berhasil diperbarui")
          reset()
        } else {
          toast.error(result.error || "Gagal memperbarui password")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memperbarui password"
        )
      }
    })
  }

  return (
    <Card className="border border-border shadow-xs gap-0 py-0 overflow-hidden flex flex-col">
      <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 border-b border-border/50">
        <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
          Ganti Kata Sandi
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Gunakan kata sandi baru yang kuat minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
        <CardContent className="p-3.5 sm:p-4 space-y-3 flex-1">
          <div className="space-y-1.5">
            <Label htmlFor="passwordBaru" className="text-xs font-medium">Kata Sandi Baru</Label>
            <PasswordInput
              id="passwordBaru"
              placeholder="Minimal 8 karakter"
              disabled={isPending}
              className="h-9 text-xs sm:text-sm"
              {...register("passwordBaru")}
            />
            {errors.passwordBaru && (
              <p className="text-xs text-destructive">
                {errors.passwordBaru.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="konfirmasiPassword" className="text-xs font-medium">Konfirmasi Kata Sandi Baru</Label>
            <PasswordInput
              id="konfirmasiPassword"
              placeholder="Ulangi kata sandi baru"
              disabled={isPending}
              className="h-9 text-xs sm:text-sm"
              {...register("konfirmasiPassword")}
            />
            {errors.konfirmasiPassword && (
              <p className="text-xs text-destructive">
                {errors.konfirmasiPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 sm:p-3.5 border-t border-border/40 bg-muted/15 flex justify-end">
          <Button type="submit" variant="secondary" disabled={isPending} className="h-8.5 px-3.5 text-xs sm:text-sm font-semibold">
            {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Perbarui Kata Sandi
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
