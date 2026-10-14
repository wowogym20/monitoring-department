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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { uploadAvatarAction } from "@/lib/actions/avatar"
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
      label: "Admin (SDM)",
      badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
    },
    user: {
      label: "Ketua Departemen",
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

  return (
    <Card className="border border-border/80 shadow-xs overflow-hidden bg-card">
      <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <UserCircle className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              Informasi Akun &amp; Foto Profil
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              Informasi peran dan atribusi departemen ditetapkan oleh sistem. Anda dapat memperbarui foto profil kapan saja.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-8">
          {/* Bagian Foto Profil */}
          <div className="flex flex-col items-center text-center shrink-0 w-full md:w-auto md:min-w-[190px]">
            <div className="relative group mb-3">
              <Avatar className="size-24 sm:size-28 ring-4 ring-primary/15 border border-border shadow-xs">
                {previewUrl && (
                  <AvatarImage
                    src={previewUrl}
                    alt={nama}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-medium gap-1"
                title="Klik untuk ubah foto"
              >
                <Camera className="size-6" />
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="h-8 px-3 text-xs gap-1.5 font-medium rounded-lg"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Upload className="size-3.5" />
              )}
              <span>Pilih Foto Baru</span>
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              JPG, PNG, atau WebP (maks. 2MB)
            </p>
          </div>

          {/* Garis Pembatas Vertikal (Desktop/Tablet) / Horizontal (Mobile) */}
          <div className="hidden md:block w-px self-stretch bg-border/70" />
          <div className="block md:hidden h-px w-full bg-border/70" />

          {/* Bagian Informasi Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-1 min-w-0">
            {/* 1. Email Akun */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" />
                <span>Email Akun</span>
              </span>
              <p className="text-sm font-semibold text-foreground truncate" title={email}>
                {email}
              </p>
            </div>

            {/* 2. Peran Pengguna */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Peran Pengguna (Role)</span>
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium px-2 py-0.5", roleLabels[role]?.badgeClass)}
                >
                  {roleLabels[role]?.label || role}
                </Badge>
              </div>
            </div>

            {/* 3. Status Akun */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>Status Akun</span>
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-0.5",
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
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  <span>Departemen yang Dipimpin</span>
                </span>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-sm font-semibold text-foreground">
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
    <Card className="border border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Informasi Personal
        </CardTitle>
        <CardDescription>
          Ubah nama lengkap dan nomor kontak Anda.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              placeholder="Masukkan nama lengkap"
              disabled={isPending}
              {...register("nama")}
            />
            {errors.nama && (
              <p className="text-xs text-destructive">{errors.nama.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_hp">Nomor HP / WhatsApp</Label>
            <Input
              id="no_hp"
              placeholder="Contoh: 081234567890"
              disabled={isPending}
              {...register("no_hp")}
            />
            {errors.no_hp && (
              <p className="text-xs text-destructive">{errors.no_hp.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    <Card className="border border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Ganti Kata Sandi
        </CardTitle>
        <CardDescription>
          Gunakan kata sandi baru yang kuat minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordBaru">Kata Sandi Baru</Label>
            <Input
              id="passwordBaru"
              type="password"
              placeholder="Minimal 8 karakter"
              disabled={isPending}
              {...register("passwordBaru")}
            />
            {errors.passwordBaru && (
              <p className="text-xs text-destructive">
                {errors.passwordBaru.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="konfirmasiPassword">Konfirmasi Kata Sandi Baru</Label>
            <Input
              id="konfirmasiPassword"
              type="password"
              placeholder="Ulangi kata sandi baru"
              disabled={isPending}
              {...register("konfirmasiPassword")}
            />
            {errors.konfirmasiPassword && (
              <p className="text-xs text-destructive">
                {errors.konfirmasiPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Perbarui Kata Sandi
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
